import Rental from "../../models/rental.model.js";
import asyncHandler from "../../services/asyncHandler.service.js";
import sendResponse from "../../services/sendResponse.service.js";

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

    // Check for existing active rental (only status: 'active')
    const existingRental = await Rental.findOne({
      user,
      status: 'active'
    });

    if (existingRental) {
      return sendResponse(res, 400, false, "User already has an active rental");
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

    const monthlySchedule = [];
    let currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const monthName = currentDate.toLocaleString("default", { month: "short" });
      const year = currentDate.getFullYear();
      monthlySchedule.push({
        month: `${monthName} ${year}`,
        amount: monthlyInstallment,
        status: "un-paid",
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
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
      amountPaid: 0,
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
      return sendResponse(res, 404, false, "No rentals found for this user");
    }

    sendResponse(res, 200, true, "Rentals retrieved successfully", rentals);
  }),

  updateRental: asyncHandler(async (req, res, next) => {
    const rentalId = req.params.id;
    const {
      annualRentAmount,
      alreadyPaidAmount,
      attachment,
      city,
      neighborhood,
      propertyOwners,
      status
    } = req.body;

    if (!rentalId) {
      return sendResponse(res, 400, false, "Rental ID is required");
    }

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return sendResponse(res, 404, false, "Rental not found");
    }

    // Update basic fields
    if (annualRentAmount !== undefined) rental.annualRentAmount = Number(annualRentAmount);
    if (alreadyPaidAmount !== undefined) rental.alreadyPaidAmount = Number(alreadyPaidAmount);
    if (attachment) rental.attachment = attachment;
    if (city) rental.city = city;
    if (neighborhood) rental.neighborhood = neighborhood;
    if (propertyOwners) rental.propertyOwners = propertyOwners;
    if (status) rental.status = status;

    // Recalculate if rent or paid amount changes
    if (annualRentAmount !== undefined || alreadyPaidAmount !== undefined) {
      const remainingPrincipal = rental.annualRentAmount - rental.alreadyPaidAmount;
      if (remainingPrincipal < 0) {
        return sendResponse(res, 400, false, "Already paid amount cannot exceed annual rent");
      }

      rental.interest = Number((remainingPrincipal * 0.2).toFixed(2));
      const totalDueWithInterest = Number((remainingPrincipal + rental.interest).toFixed(2));
      rental.monthlyInstallment = Number((totalDueWithInterest / 12).toFixed(2));

      // Update monthly schedule
      rental.monthlySchedule = [];
      let currentDate = new Date();
      for (let i = 0; i < 12; i++) {
        const monthName = currentDate.toLocaleString("default", { month: "short" });
        const year = currentDate.getFullYear();
        rental.monthlySchedule.push({
          month: `${monthName} ${year}`,
          amount: rental.monthlyInstallment,
          status: "un-paid",
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      rental.dueAmount = rental.monthlySchedule
        .filter(m => m.status === "un-paid")
        .reduce((sum, m) => sum + m.amount, 0);
    }

    await rental.save();
    sendResponse(res, 200, true, "Rental updated successfully", rental);
  }),

  deleteRental: asyncHandler(async (req, res, next) => {
    const rentalId = req.params.id;

    if (!rentalId) {
      return sendResponse(res, 400, false, "Rental ID is required");
    }

    const rental = await Rental.findByIdAndDelete(rentalId);
    if (!rental) {
      return sendResponse(res, 404, false, "Rental not found");
    }

    sendResponse(res, 200, true, "Rental deleted successfully");
  }),
};

export default rentalController;
