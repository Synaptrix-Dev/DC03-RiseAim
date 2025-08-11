import Rental from "../../models/rental.model.js";
import User from '../../models/user.model.js';
import asyncHandler from "../../services/asyncHandler.service.js";
import sendResponse from "../../services/sendResponse.service.js";

// Helper function to format Date to a readable timestamp string
const formatTimestamp = (date) => {
  return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
};

const rentalController = {
  createRental: asyncHandler(async (req, res, next) => {
    const user = req.user.id;
    const {
      annualRentAmount,
      alreadyPaidAmount = 0,
      attachment,
      city,
      neighborhood,
      propertyOwners,
    } = req.body;

    // Validate required fields
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
      // Check if property owner phone already exists in Rental
      const existingOwnerInRental = await Rental.findOne({
        "propertyOwners.phone": propertyOwners.phone
      });
      if (existingOwnerInRental) {
        return sendResponse(res, 400, false, "A rental already exists with this property owner's phone");
      }

      // Check if property owner phone matches any User's phone
      const existingUserWithPhone = await User.findOne({
        phone: propertyOwners.phone
      });
      if (existingUserWithPhone) {
        return sendResponse(res, 400, false, "This property owner's phone is already registered to a user");
      }

      // Check for existing active rental (based on your preference for 'active' status)
      const existingRental = await Rental.findOne({
        user,
        status: "active"
      });
      if (existingRental) {
        return sendResponse(
          res,
          400,
          false,
          "You can only create a new rental when no active rentals exist"
        );
      }

      // Convert inputs to numbers
      const annualAmountNum = Number(annualRentAmount);
      const alreadyPaidNum = Number(alreadyPaidAmount);

      // Validate numbers
      if (isNaN(annualAmountNum) || annualAmountNum <= 0) {
        return sendResponse(res, 400, false, "Invalid annualRentAmount");
      }
      if (isNaN(alreadyPaidNum) || alreadyPaidNum < 0) {
        return sendResponse(res, 400, false, "Invalid alreadyPaidAmount");
      }

      // Calculate remaining principal
      const remainingPrincipal = annualAmountNum - alreadyPaidNum;
      if (remainingPrincipal < 0) {
        return sendResponse(
          res,
          400,
          false,
          "Already paid amount cannot exceed annual rent"
        );
      }

      // Calculate interest (20%) and totals
      const interest = Number((remainingPrincipal * 0.2).toFixed(2));
      const totalDueWithInterest = Number((remainingPrincipal + interest).toFixed(2));
      const monthlyInstallment = Number((totalDueWithInterest / 12).toFixed(2));

      // Build monthly payment schedule with Date objects
      const monthlySchedule = [];
      let currentDate = new Date();
      const startDay = currentDate.getDate();
      let amountRemaining = totalDueWithInterest;

      for (let i = 0; i < 12; i++) {
        currentDate.setDate(startDay);
        const timestamp = new Date(currentDate); // Store as Date object

        let status = "un-paid";
        if (i === 0 && alreadyPaidNum > 0) {
          status = "paid";
          amountRemaining -= monthlyInstallment;
        }

        monthlySchedule.push({
          month: timestamp, // Store as Date object
          amount: monthlyInstallment,
          status,
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Calculate total due
      const dueAmount = monthlySchedule
        .filter(m => m.status === "un-paid")
        .reduce((sum, m) => sum + m.amount, 0);

      // Create rental
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
      // Format timestamps for response
      const formattedRental = {
        ...rental.toObject(),
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(schedule.month),
        })),
      };
      sendResponse(res, 201, true, "Rental created successfully", formattedRental);
    } catch (error) {
      return sendResponse(res, 500, false, `Error creating rental: ${error.message}`);
    }
  }),

  getRental: asyncHandler(async (req, res, next) => {
    const user = req.user.id;

    if (!user) {
      return sendResponse(res, 400, false, "User ID is required");
    }

    try {
      const rentals = await Rental.find({ user })
        .populate("user", "-password")
        .lean();

      if (!rentals || rentals.length === 0) {
        return sendResponse(res, 200, true, "No rentals found for this user", []);
      }

      // Format timestamps for response
      const formattedRentals = rentals.map(rental => ({
        ...rental,
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(new Date(schedule.month)),
        })),
      }));

      sendResponse(res, 200, true, "Rentals retrieved successfully", formattedRentals);
    } catch (error) {
      return sendResponse(res, 500, false, `Error retrieving rentals: ${error.message}`);
    }
  }),

  getCurrentRental: asyncHandler(async (req, res, next) => {
    const user = req.user.id;

    if (!user) {
      return sendResponse(res, 400, false, "User ID is required");
    }

    try {
      const rentals = await Rental.find({
        user,
        status: { $in: ["approved", "active"] }
      })
        .populate("user", "-password")
        .lean();

      if (!rentals || rentals.length === 0) {
        return sendResponse(res, 200, true, "No rentals found for this user", []);
      }

      // Format timestamps for response
      const formattedRentals = rentals.map(rental => ({
        ...rental,
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(new Date(schedule.month)),
        })),
      }));

      sendResponse(res, 200, true, "Rentals retrieved successfully", formattedRentals);
    } catch (error) {
      return sendResponse(res, 500, false, `Error retrieving current rentals: ${error.message}`);
    }
  }),

  getByFilterUserRental: asyncHandler(async (req, res, next) => {
    const user = req.user.id;
    const { status, monthYear } = req.query;

    if (!user) {
      return sendResponse(res, 400, false, "User ID is required");
    }

    if (!status && !monthYear) {
      return sendResponse(res, 400, false, "At least one filter (status or monthYear) is required");
    }

    try {
      const rentals = await Rental.find({ user }).lean();

      if (!rentals || rentals.length === 0) {
        return sendResponse(res, 200, true, "No rentals found for this user", []);
      }

      const filteredRentals = rentals
        .map(rental => {
          const filteredSchedule = rental.monthlySchedule.filter(schedule => {
            let matches = true;
            const scheduleDate = new Date(schedule.month);

            if (status) {
              matches = matches && schedule.status.toLowerCase() === status.toLowerCase();
            }

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

          if (filteredSchedule.length > 0) {
            return {
              ...rental,
              monthlySchedule: filteredSchedule.map(schedule => ({
                ...schedule,
                month: formatTimestamp(new Date(schedule.month)),
              })),
            };
          }
          return null;
        })
        .filter(Boolean);

      if (filteredRentals.length === 0) {
        return sendResponse(res, 200, true, "No rentals match the provided filters", []);
      }

      sendResponse(res, 200, true, "Filtered rentals retrieved successfully", filteredRentals);
    } catch (error) {
      return sendResponse(res, 500, false, `Error filtering rentals: ${error.message}`);
    }
  }),

  getRentalById: asyncHandler(async (req, res, next) => {
    const { id } = req.query;

    if (!id) {
      return sendResponse(res, 400, false, "Rental application ID is required");
    }

    try {
      const rental = await Rental.findById(id).lean();

      if (!rental) {
        return sendResponse(res, 404, false, "Rental application not found");
      }

      // Format timestamps for response
      const formattedRental = {
        ...rental,
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(new Date(schedule.month)),
        })),
      };

      sendResponse(res, 200, true, "Rental application details retrieved", formattedRental);
    } catch (error) {
      return sendResponse(res, 500, false, `Error retrieving rental: ${error.message}`);
    }
  }),

  updateMonthlyBreakdown: asyncHandler(async (req, res, next) => {
    const { rentalId, monthYear } = req.query;

    if (!rentalId || !monthYear) {
      return sendResponse(res, 400, false, "Rental ID and monthYear are required");
    }

    try {
      const rental = await Rental.findById(rentalId);
      if (!rental) {
        return sendResponse(res, 404, false, "Rental application not found");
      }

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
          if (schedule.status === "paid") {
            return schedule; // Already paid, skip
          }
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

      // Format timestamps for response
      const formattedRental = {
        ...rental.toObject(),
        monthlySchedule: rental.monthlySchedule.map(schedule => ({
          ...schedule,
          month: formatTimestamp(new Date(schedule.month)),
        })),
      };

      sendResponse(res, 200, true, "Monthly breakdown updated successfully", formattedRental);
    } catch (error) {
      return sendResponse(res, 500, false, `Error updating monthly breakdown: ${error.message}`);
    }
  }),

  getUserRentalApplicationsWithOwner: asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, 401, false, "User not authenticated");
    }

    try {
      const applications = await Rental.find({ user: userId })
        .select("propertyOwners status")
        .lean();

      if (!applications.length) {
        return sendResponse(res, 404, false, "No rental applications found");
      }

      // Format timestamps for response
      const formattedApplications = applications.map(app => ({
        ...app,
        monthlySchedule: app.monthlySchedule?.map(schedule => ({
          ...schedule,
          month: formatTimestamp(new Date(schedule.month)),
        })) || [],
      }));

      return sendResponse(res, 200, true, "Rental application owners fetched successfully", formattedApplications);
    } catch (error) {
      return sendResponse(res, 500, false, `Error retrieving applications: ${error.message}`);
    }
  }),
};

export default rentalController;
