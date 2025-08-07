import Contract from "../../models/contract.model.js";
import asyncHandler from "../../services/asyncHandler.service.js";
import sendResponse from "../../services/sendResponse.service.js";

const contractController = {
  createContract: asyncHandler(async (req, res, next) => {
    const { user, contractorName, contactNumber, status, location } = req.body;

    if (!user || !contractorName || !contactNumber || !location) {
      return sendResponse(res, 400, false, "Required fields are missing");
    }

    const contract = new Contract({
      user,
      contractorName,
      contactNumber,
      status: status || "pending",
      location,
    });

    await contract.save();

    sendResponse(res, 201, true, "Contract created successfully", contract);
  }),

  getContract: asyncHandler(async (req, res, next) => {
    const contractId = req.params.id;

    if (!contractId) {
      return sendResponse(res, 400, false, "Contract ID is required");
    }

    const contract = await Contract.findById(contractId)
      .populate("user", "-password")
      .lean();
    if (!contract) {
      return sendResponse(res, 404, false, "Contract not found");
    }

    sendResponse(res, 200, true, "Contract retrieved successfully", contract);
  }),

  updateContract: asyncHandler(async (req, res, next) => {
    const contractId = req.params.id;
    const { contractorName, contactNumber, status, location } = req.body;

    if (!contractId) {
      return sendResponse(res, 400, false, "Contract ID is required");
    }

    const updateData = {};
    if (contractorName) updateData.contractorName = contractorName;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (status) updateData.status = status;
    if (location) updateData.location = location;

    if (Object.keys(updateData).length === 0) {
      return sendResponse(res, 400, false, "No data provided for update");
    }

    const updatedContract = await Contract.findByIdAndUpdate(
      contractId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("user", "-password");

    if (!updatedContract) {
      return sendResponse(res, 404, false, "Contract not found");
    }

    sendResponse(
      res,
      200,
      true,
      "Contract updated successfully",
      updatedContract
    );
  }),

  deleteContract: asyncHandler(async (req, res, next) => {
    const contractId = req.params.id;

    if (!contractId) {
      return sendResponse(res, 400, false, "Contract ID is required");
    }

    const contract = await Contract.findByIdAndDelete(contractId);
    if (!contract) {
      return sendResponse(res, 404, false, "Contract not found");
    }

    sendResponse(res, 200, true, "Contract deleted successfully");
  }),
};

export default contractController;
