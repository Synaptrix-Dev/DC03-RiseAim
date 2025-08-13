import Support from "../../models/support.model.js";
import asyncHandler from "../../services/asyncHandler.service.js";
import sendResponse from "../../services/sendResponse.service.js";

// CREATE
const createSupport = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { title, description } = req.body;

    if (!userId) return sendResponse(res, 400, false, "User ID is required");
    if (!title || !description) return sendResponse(res, 400, false, "Title and description are required");

    const newSupport = await Support.create({
        user: userId,
        title,
        description
    });

    sendResponse(res, 201, true, "Support request created successfully", newSupport);
});

// GET ALL supports of logged-in user
const getUserSupports = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) return sendResponse(res, 400, false, "User ID is required");

    const supports = await Support.find({ user: userId }).sort({ createdAt: -1 });

    sendResponse(res, 200, true, "User supports fetched successfully", supports);
});

// GET SINGLE support by ID
const getSupportById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const support = await Support.findById(id);
    if (!support) return sendResponse(res, 404, false, "Support not found");

    sendResponse(res, 200, true, "Support fetched successfully", support);
});

// UPDATE support
const updateSupport = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    const updated = await Support.findByIdAndUpdate(
        id,
        { title, description },
        { new: true, runValidators: true }
    );

    if (!updated) return sendResponse(res, 404, false, "Support not found");

    sendResponse(res, 200, true, "Support updated successfully", updated);
});

// DELETE support (via query param)
const deleteSupport = asyncHandler(async (req, res) => {
    const { id } = req.query;

    if (!id) return sendResponse(res, 400, false, "Support ID is required");

    const deleted = await Support.findByIdAndDelete(id);
    if (!deleted) return sendResponse(res, 404, false, "Support not found");

    sendResponse(res, 200, true, "Support deleted successfully");
});

export default {
    createSupport,
    getUserSupports,
    getSupportById,
    updateSupport,
    deleteSupport
};
