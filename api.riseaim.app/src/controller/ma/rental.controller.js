import Rental from "../../models/rental.model.js";
import asyncHandler from "../../services/asyncHandler.service.js";
import sendResponse from "../../services/sendResponse.service.js";

const rentalController = {
  createRental: asyncHandler(async (req, res, next) => {
    const {
      user,
      rentAmount,
      amountPaid,
      attachment,
      city,
      neighborhood,
      propertyOwners,
    } = req.body;

    if (
      !user ||
      !rentAmount ||
      !city ||
      !neighborhood ||
      !propertyOwners?.fullName ||
      !propertyOwners?.phone
    ) {
      return sendResponse(res, 400, false, "Required fields are missing");
    }

    const rental = new Rental({
      user,
      rentAmount,
      amountPaid,
      attachment,
      city,
      neighborhood,
      propertyOwners,
    });

    await rental.save();

    sendResponse(res, 201, true, "Rental created successfully", rental);
  }),

  getRental: asyncHandler(async (req, res, next) => {
    const rentalId = req.params.id;

    if (!rentalId) {
      return sendResponse(res, 400, false, "Rental ID is required");
    }

    const rental = await Rental.findById(rentalId)
      .populate("user", "-password")
      .lean();
    if (!rental) {
      return sendResponse(res, 404, false, "Rental not found");
    }

    sendResponse(res, 200, true, "Rental retrieved successfully", rental);
  }),

  updateRental: asyncHandler(async (req, res, next) => {
    const rentalId = req.params.id;
    const {
      rentAmount,
      amountPaid,
      attachment,
      city,
      neighborhood,
      propertyOwners,
    } = req.body;

    if (!rentalId) {
      return sendResponse(res, 400, false, "Rental ID is required");
    }

    const updateData = {};
    if (rentAmount) updateData.rentAmount = rentAmount;
    if (amountPaid !== undefined) updateData.amountPaid = amountPaid;
    if (attachment) updateData.attachment = attachment;
    if (city) updateData.city = city;
    if (neighborhood) updateData.neighborhood = neighborhood;
    if (propertyOwners) updateData.propertyOwners = propertyOwners;

    if (Object.keys(updateData).length === 0) {
      return sendResponse(res, 400, false, "No data provided for update");
    }

    const updatedRental = await Rental.findByIdAndUpdate(rentalId, updateData, {
      new: true,
      runValidators: true,
    }).populate("user", "-password");

    if (!updatedRental) {
      return sendResponse(res, 404, false, "Rental not found");
    }

    sendResponse(res, 200, true, "Rental updated successfully", updatedRental);
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
