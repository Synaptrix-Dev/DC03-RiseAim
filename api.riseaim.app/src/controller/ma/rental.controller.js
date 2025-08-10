import Rental from "../../models/rental.model.js";
import User from '../../models/user.model.js'
import asyncHandler from "../../services/asyncHandler.service.js";
import sendResponse from "../../services/sendResponse.service.js";

const rentalController = {
  // createRental: asyncHandler(async (req, res, next) => {
  //   const user = req.user.id;
  //   const {
  //     annualRentAmount,
  //     alreadyPaidAmount = 0,
  //     attachment,
  //     city,
  //     neighborhood,
  //     propertyOwners,
  //   } = req.body;

  //   // Validate required fields
  //   if (
  //     !user ||
  //     annualRentAmount === undefined ||
  //     !city ||
  //     !neighborhood ||
  //     !propertyOwners?.fullName ||
  //     !propertyOwners?.phone
  //   ) {
  //     return sendResponse(res, 400, false, "Required fields are missing");
  //   }

  //   // Check if there is any existing rental that is NOT closed
  //   const existingRental = await Rental.findOne({
  //     user,
  //     status: { $ne: "closed" }
  //   });

  //   if (existingRental) {
  //     return sendResponse(
  //       res,
  //       400,
  //       false,
  //       "You can only create a new rental when all previous applications are closed"
  //     );
  //   }

  //   // Convert inputs to numbers
  //   const annualAmountNum = Number(annualRentAmount);
  //   const alreadyPaidNum = Number(alreadyPaidAmount);

  //   // Validate numbers
  //   if (isNaN(annualAmountNum) || annualAmountNum <= 0) {
  //     return sendResponse(res, 400, false, "Invalid annualRentAmount");
  //   }
  //   if (isNaN(alreadyPaidNum) || alreadyPaidNum < 0) {
  //     return sendResponse(res, 400, false, "Invalid alreadyPaidAmount");
  //   }

  //   // Calculate remaining principal after already paid amount
  //   const remainingPrincipal = annualAmountNum - alreadyPaidNum;
  //   if (remainingPrincipal < 0) {
  //     return sendResponse(
  //       res,
  //       400,
  //       false,
  //       "Already paid amount cannot exceed annual rent"
  //     );
  //   }

  //   // Calculate interest (20%) on remaining amount
  //   const interest = Number((remainingPrincipal * 0.2).toFixed(2));
  //   const totalDueWithInterest = Number(
  //     (remainingPrincipal + interest).toFixed(2)
  //   );
  //   const monthlyInstallment = Number(
  //     (totalDueWithInterest / 12).toFixed(2)
  //   );

  //   // Build monthly payment schedule with full date
  //   const monthlySchedule = [];
  //   let currentDate = new Date();
  //   const startDay = currentDate.getDate(); // Keep same day across months
  //   let amountRemaining = totalDueWithInterest;

  //   for (let i = 0; i < 12; i++) {
  //     currentDate.setDate(startDay);
  //     const day = String(currentDate.getDate()).padStart(2, "0");
  //     const monthName = currentDate.toLocaleString("default", { month: "long" });
  //     const year = currentDate.getFullYear();

  //     let status = "un-paid";

  //     // If already paid covers at least the first month, mark it paid
  //     if (i === 0 && alreadyPaidNum > 0) {
  //       status = "paid";
  //       amountRemaining -= monthlyInstallment;
  //     }

  //     monthlySchedule.push({
  //       month: `${day} ${monthName} ${year}`, // Example: "11 August 2025"
  //       amount: monthlyInstallment,
  //       status,
  //     });

  //     currentDate.setMonth(currentDate.getMonth() + 1);
  //   }

  //   // Calculate total due amount after marking first month as paid
  //   const dueAmount = monthlySchedule
  //     .filter(m => m.status === "un-paid")
  //     .reduce((sum, m) => sum + m.amount, 0);

  //   // Create rental document
  //   const rental = new Rental({
  //     user,
  //     status: "pending",
  //     annualRentAmount: annualAmountNum,
  //     alreadyPaidAmount: alreadyPaidNum,
  //     monthlyInstallment,
  //     interest,
  //     dueAmount,
  //     amountPaid: alreadyPaidNum,
  //     attachment,
  //     city,
  //     neighborhood,
  //     propertyOwners,
  //     monthlySchedule,
  //   });

  //   // Save rental
  //   await rental.save();

  //   // Send response
  //   sendResponse(res, 201, true, "Rental created successfully", rental);
  // }),

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

    // Check if there is any existing rental that is NOT closed for this user
    const existingRental = await Rental.findOne({
      user,
      status: { $ne: "closed" }
    });
    if (existingRental) {
      return sendResponse(
        res,
        400,
        false,
        "You can only create a new rental when all previous applications are closed"
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

    // Calculate remaining principal after already paid amount
    const remainingPrincipal = annualAmountNum - alreadyPaidNum;
    if (remainingPrincipal < 0) {
      return sendResponse(
        res,
        400,
        false,
        "Already paid amount cannot exceed annual rent"
      );
    }

    // Calculate interest (20%) on remaining amount
    const interest = Number((remainingPrincipal * 0.2).toFixed(2));
    const totalDueWithInterest = Number(
      (remainingPrincipal + interest).toFixed(2)
    );
    const monthlyInstallment = Number(
      (totalDueWithInterest / 12).toFixed(2)
    );

    // Build monthly payment schedule with full date
    const monthlySchedule = [];
    let currentDate = new Date();
    const startDay = currentDate.getDate();
    let amountRemaining = totalDueWithInterest;

    for (let i = 0; i < 12; i++) {
      currentDate.setDate(startDay);
      const day = String(currentDate.getDate()).padStart(2, "0");
      const monthName = currentDate.toLocaleString("default", { month: "long" });
      const year = currentDate.getFullYear();

      let status = "un-paid";
      if (i === 0 && alreadyPaidNum > 0) {
        status = "paid";
        amountRemaining -= monthlyInstallment;
      }

      monthlySchedule.push({
        month: `${day} ${monthName} ${year}`,
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
    sendResponse(res, 201, true, "Rental created successfully", rental);
  }),

  getRental: asyncHandler(async (req, res, next) => {
    const user = req.user.id;

    if (!user) {
      return sendResponse(res, 400, false, "User ID is required");
    }

    const rentals = await Rental.find({ user })
      .populate("user", "-password")
      .lean();

    if (!rentals || rentals.length === 0) {
      return sendResponse(res, 200, true, "No rentals found for this user", []);
    }

    sendResponse(res, 200, true, "Rentals retrieved successfully", rentals);
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

    const rentals = await Rental.find({ user }).lean();

    if (!rentals || rentals.length === 0) {
      return sendResponse(res, 200, true, "No rentals found for this user", []);
    }

    const filteredRentals = rentals
      .map(rental => {
        const filteredSchedule = rental.monthlySchedule.filter(schedule => {
          let matches = true;

          if (status) {
            matches = matches && schedule.status.toLowerCase() === status.toLowerCase();
          }

          if (monthYear) {
            matches = matches && schedule.month.toLowerCase().includes(monthYear.toLowerCase());
          }

          return matches;
        });

        if (filteredSchedule.length > 0) {
          return {
            ...rental,
            monthlySchedule: filteredSchedule
          };
        }
        return null;
      })
      .filter(Boolean);

    if (filteredRentals.length === 0) {
      return sendResponse(res, 200, true, "No rentals match the provided filters", []);
    }

    sendResponse(res, 200, true, "Filtered rentals retrieved successfully", filteredRentals);
  }),


  getRentalById: asyncHandler(async (req, res, next) => {
    const { id } = req.query;

    if (!id) {
      return sendResponse(res, 400, false, "Rental application ID is required");
    }

    const rental = await Rental.findById(id)

    if (!rental) {
      return sendResponse(res, 404, false, "Rental application not found");
    }

    sendResponse(res, 200, true, "Rental application details retrieved", rental);
  }),

  updateMonthlyBreakdown: asyncHandler(async (req, res, next) => {
    const { rentalId, monthYear } = req.query;

    if (!rentalId || !monthYear) {
      return sendResponse(res, 400, false, "Rental ID and monthYear are required");
    }

    // Find rental
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return sendResponse(res, 404, false, "Rental application not found");
    }

    let foundMonth = false;

    // Update the monthly schedule
    rental.monthlySchedule = rental.monthlySchedule.map(schedule => {
      if (
        schedule.month.toLowerCase() === monthYear.toLowerCase() ||
        schedule.month.toLowerCase().includes(monthYear.toLowerCase())
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

    sendResponse(res, 200, true, "Monthly breakdown updated successfully", rental);
  }),

  getUserRentalApplicationsWithOwner: asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, 401, false, "User not authenticated");
    }

    // Fetch only propertyOwners and status fields
    const applications = await Rental.find({ user: userId })
      .select("propertyOwners status")
      .lean();

    if (!applications.length) {
      return sendResponse(res, 404, false, "No rental applications found");
    }

    return sendResponse(res, 200, true, "Rental application owners fetched successfully", applications);
  })

};

export default rentalController;
