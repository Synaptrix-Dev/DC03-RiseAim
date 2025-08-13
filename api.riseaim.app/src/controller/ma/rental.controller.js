import Rental from "../../models/rental.model.js";
import User from '../../models/user.model.js';
import asyncHandler from "../../services/asyncHandler.service.js";
import sendResponse from "../../services/sendResponse.service.js";

const formatTimestamp = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  if (isNaN(date)) return null; // invalid date guard
  // Return in the same local format as stored
  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0") + " " +
    String(date.getHours()).padStart(2, "0") + ":" +
    String(date.getMinutes()).padStart(2, "0") + ":" +
    String(date.getSeconds()).padStart(2, "0");
};

const rentalController = {
  createRental: asyncHandler(async (req, res) => {
    const user = req.user.id;
    const {
      annualRentAmount,
      alreadyPaidAmount = 0,
      attachment,
      city,
      neighborhood,
      propertyOwners,
    } = req.body;

    if (
      !user ||
      annualRentAmount === undefined ||
      !city ||
      !neighborhood ||
      !propertyOwners?.fullName ||
      !propertyOwners?.phone
    ) {
      return sendResponse(res, 400, false, "Required fields are missing");
    }

    try {
      const existingOwnerInRental = await Rental.findOne({
        "propertyOwners.phone": propertyOwners.phone
      });
      if (existingOwnerInRental) {
        return sendResponse(res, 400, false, "A rental already exists with this property owner's phone");
      }

      const existingUserWithPhone = await User.findOne({
        phone: propertyOwners.phone
      });
      if (existingUserWithPhone) {
        return sendResponse(res, 400, false, "This property owner's phone is already registered to a user");
      }

      const existingRental = await Rental.findOne({
        user,
        status: "active"
      });
      if (existingRental) {
        return sendResponse(res, 400, false, "You can only create a new rental when no active rentals exist");
      }

      const annualAmountNum = Number(annualRentAmount);
      const alreadyPaidNum = Number(alreadyPaidAmount);

      if (isNaN(annualAmountNum) || annualAmountNum <= 0) {
        return sendResponse(res, 400, false, "Invalid annualRentAmount");
      }
      if (isNaN(alreadyPaidNum) || alreadyPaidNum < 0) {
        return sendResponse(res, 400, false, "Invalid alreadyPaidAmount");
      }

      const remainingPrincipal = annualAmountNum - alreadyPaidNum;
      if (remainingPrincipal < 0) {
        return sendResponse(res, 400, false, "Already paid amount cannot exceed annual rent");
      }

      const interest = Number((remainingPrincipal * 0.2).toFixed(2));
      const totalDueWithInterest = Number((remainingPrincipal + interest).toFixed(2));
      const monthlyInstallment = Number((totalDueWithInterest / 12).toFixed(2));

      // Use exact creation timestamp
      const baseDate = new Date();
      const startDay = baseDate.getDate();
      const startHours = baseDate.getHours();
      const startMinutes = baseDate.getMinutes();
      const startSeconds = baseDate.getSeconds();

      const monthlySchedule = [];
      let amountRemaining = totalDueWithInterest;

      for (let i = 0; i < 12; i++) {
        const scheduleDate = new Date(baseDate);
        scheduleDate.setMonth(baseDate.getMonth() + i);
        scheduleDate.setDate(startDay);
        scheduleDate.setHours(startHours, startMinutes, startSeconds, 0);

        let status = "un-paid";
        if (i === 0 && alreadyPaidNum > 0) {
          status = "paid";
          amountRemaining -= monthlyInstallment;
        }

        monthlySchedule.push({
          month: scheduleDate, // exact same time as createdAt, only month changes
          amount: monthlyInstallment,
          status,
        });
      }

      const dueAmount = monthlySchedule
        .filter(m => m.status === "un-paid")
        .reduce((sum, m) => sum + m.amount, 0);

      const rental = new Rental({
        user,
        status: "pending",
        annualRentAmount: annualAmountNum,
        alreadyPaidAmount: alreadyPaidNum,
        monthlyInstallment,
        interest,
        dueAmount,
        amountPaid: alreadyPaidNum,
        attachment,
        city,
        neighborhood,
        propertyOwners,
        monthlySchedule,
      });

      await rental.save();

      const formattedRental = {
        ...rental.toObject(),
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(schedule.month), // same format as createdAt
        })),
        createdAt: formatTimestamp(rental.createdAt)
      };

      sendResponse(res, 201, true, "Rental created successfully", formattedRental);
    } catch (error) {
      sendResponse(res, 500, false, `Error creating rental: ${error.message}`);
    }
  }),

  // GET RENTALS
  getRental: asyncHandler(async (req, res) => {
    const user = req.user.id;
    if (!user) return sendResponse(res, 400, false, "User ID is required");

    try {
      const rentals = await Rental.find({ user }).populate("user", "-password").lean();
      if (!rentals.length) {
        return sendResponse(res, 200, true, "No rentals found for this user", []);
      }

      const formatted = rentals.map(rental => ({
        ...rental,
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(schedule.month),
        })),
      }));

      sendResponse(res, 200, true, "Rentals retrieved successfully", formatted);
    } catch (error) {
      sendResponse(res, 500, false, `Error retrieving rentals: ${error.message}`);
    }
  }),

  getCurrentRental: asyncHandler(async (req, res) => {
    const user = req.user.id;
    if (!user) return sendResponse(res, 400, false, "User ID is required");

    try {
      const rentals = await Rental.find({
        user,
        status: { $in: ["active", "verified"] } // Filter only active or verified
      })
        .populate("user", "-password")
        .lean();

      if (!rentals.length) {
        return sendResponse(res, 200, true, "No active or verified rentals found", []);
      }

      const formatted = rentals.map(rental => ({
        ...rental,
        monthlySchedule: rental.monthlySchedule?.map(schedule => ({
          ...schedule,
          month: formatTimestamp(schedule.month),
        })) || [],
      }));

      sendResponse(res, 200, true, "Active/Verified rentals retrieved successfully", formatted);
    } catch (error) {
      sendResponse(res, 500, false, `Error retrieving rentals: ${error.message}`);
    }
  }),


  // GET CURRENT RENTAL
  getCurrentRental: asyncHandler(async (req, res) => {
    const user = req.user.id;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    try {
      const rental = await Rental.findOne({
        user,
        status: { $in: ["verified", "active"] }
      })
        .populate("user", "-password")
        .lean();

      if (!rental) {
        return res.status(200).json({
          success: true,
          message: "No rentals found for this user",
          currentActiveVerifiedApplication: null
        });
      }

      const formatted = {
        ...rental,
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(schedule.month),
        })),
      };

      res.status(200).json({
        success: true,
        message: "Current active/verified rental retrieved successfully",
        currentActiveVerifiedApplication: formatted
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error retrieving current rental: ${error.message}`
      });
    }
  }),

  // FILTER RENTALS
  getByFilterUserRental: asyncHandler(async (req, res) => {
    const user = req.user.id;
    const { status, monthYear } = req.query;

    if (!user) return sendResponse(res, 400, false, "User ID is required");
    if (!status && !monthYear) {
      return sendResponse(res, 400, false, "At least one filter (status or monthYear) is required");
    }

    try {
      const rentals = await Rental.find({ user }).lean();
      if (!rentals.length) {
        return sendResponse(res, 200, true, "No rentals found for this user", []);
      }

      const filtered = rentals
        .map(rental => {
          const scheduleFiltered = rental.monthlySchedule.filter(schedule => {
            let matches = true;
            const scheduleDate = new Date(schedule.month);

            if (status) matches = matches && schedule.status.toLowerCase() === status.toLowerCase();
            if (monthYear) {
              const [month, year] = monthYear.split(' ');
              const scheduleMonth = scheduleDate.toLocaleString('default', { month: 'long' });
              const scheduleYear = scheduleDate.getFullYear().toString();
              matches = matches &&
                scheduleMonth.toLowerCase() === month.toLowerCase() &&
                scheduleYear === year;
            }
            return matches;
          });

          if (scheduleFiltered.length) {
            return {
              ...rental,
              monthlySchedule: scheduleFiltered.map(s => ({
                ...s,
                month: formatTimestamp(s.month),
              })),
            };
          }
          return null;
        })
        .filter(Boolean);

      if (!filtered.length) {
        return sendResponse(res, 200, true, "No rentals match the provided filters", []);
      }

      sendResponse(res, 200, true, "Filtered rentals retrieved successfully", filtered);
    } catch (error) {
      sendResponse(res, 500, false, `Error filtering rentals: ${error.message}`);
    }
  }),

  // GET RENTAL BY ID
  getRentalById: asyncHandler(async (req, res) => {
    const { id } = req.query;
    if (!id) return sendResponse(res, 400, false, "Rental application ID is required");

    try {
      const rental = await Rental.findById(id).lean();
      if (!rental) return sendResponse(res, 404, false, "Rental application not found");

      const formatted = {
        ...rental,
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(schedule.month),
        })),
      };

      sendResponse(res, 200, true, "Rental application details retrieved", formatted);
    } catch (error) {
      sendResponse(res, 500, false, `Error retrieving rental: ${error.message}`);
    }
  }),

  // UPDATE MONTHLY BREAKDOWN
  updateMonthlyBreakdown: asyncHandler(async (req, res) => {
    const { rentalId, monthYear } = req.query;
    if (!rentalId || !monthYear) {
      return sendResponse(res, 400, false, "Rental ID and monthYear are required");
    }

    try {
      const rental = await Rental.findById(rentalId);
      if (!rental) return sendResponse(res, 404, false, "Rental application not found");

      let foundMonth = false;

      rental.monthlySchedule = rental.monthlySchedule.map(schedule => {
        const scheduleDate = new Date(schedule.month);
        const [month, year] = monthYear.split(' ');
        const scheduleMonth = scheduleDate.toLocaleString('default', { month: 'long' });
        const scheduleYear = scheduleDate.getFullYear().toString();

        if (
          scheduleMonth.toLowerCase() === month.toLowerCase() &&
          scheduleYear === year
        ) {
          if (schedule.status === "paid") return schedule;
          schedule.status = "paid";
          rental.amountPaid = Number((rental.amountPaid + schedule.amount).toFixed(2));
          rental.dueAmount = Number((rental.dueAmount - schedule.amount).toFixed(2));
          foundMonth = true;
        }
        return schedule;
      });

      if (!foundMonth) {
        return sendResponse(res, 404, false, "No matching month/year found in schedule");
      }

      await rental.save();

      const formatted = {
        ...rental.toObject(),
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(schedule.month),
        })),
      };

      sendResponse(res, 200, true, "Monthly breakdown updated successfully", formatted);
    } catch (error) {
      sendResponse(res, 500, false, `Error updating monthly breakdown: ${error.message}`);
    }
  }),

  // GET RENTAL OWNERS
  getUserRentalApplicationsWithOwner: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, 401, false, "User not authenticated");

    try {
      const applications = await Rental.find({ user: userId })
        .select("propertyOwners status monthlySchedule")
        .lean();

      if (!applications.length) {
        return sendResponse(res, 404, false, "No rental applications found");
      }

      const formatted = applications.map(app => ({
        ...app,
        monthlySchedule: app.monthlySchedule?.map(schedule => ({
          ...schedule,
          month: formatTimestamp(schedule.month),
        })) || [],
      }));

      sendResponse(res, 200, true, "Rental application owners fetched successfully", formatted);
    } catch (error) {
      sendResponse(res, 500, false, `Error retrieving applications: ${error.message}`);
    }
  }),
};

export default rentalController;
