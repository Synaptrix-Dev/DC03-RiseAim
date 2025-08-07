import Payment from "../../models/payment.model.js";
import asyncHandler from "../../services/asyncHandler.service.js";
import sendResponse from "../../services/sendResponse.service.js";

const paymentController = {
  createPayment: asyncHandler(async (req, res, next) => {
    const { payer, amount, date, status } = req.body;

    if (!payer || !amount || !date) {
      return sendResponse(res, 400, false, "Required fields are missing");
    }

    const payment = new Payment({
      payer,
      amount,
      date,
      status: status || "incoming",
    });

    await payment.save();

    sendResponse(res, 201, true, "Payment created successfully", payment);
  }),

  getPayment: asyncHandler(async (req, res, next) => {
    const paymentId = req.params.id;

    if (!paymentId) {
      return sendResponse(res, 400, false, "Payment ID is required");
    }

    const payment = await Payment.findById(paymentId)
      .populate("payer", "-password")
      .lean();
    if (!payment) {
      return sendResponse(res, 404, false, "Payment not found");
    }

    sendResponse(res, 200, true, "Payment retrieved successfully", payment);
  }),

  updatePayment: asyncHandler(async (req, res, next) => {
    const paymentId = req.params.id;
    const { amount, date, status } = req.body;

    if (!paymentId) {
      return sendResponse(res, 400, false, "Payment ID is required");
    }

    const updateData = {};
    if (amount) updateData.amount = amount;
    if (date) updateData.date = date;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return sendResponse(res, 400, false, "No data provided for update");
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("payer", "-password");

    if (!updatedPayment) {
      return sendResponse(res, 404, false, "Payment not found");
    }

    sendResponse(
      res,
      200,
      true,
      "Payment updated successfully",
      updatedPayment
    );
  }),

  deletePayment: asyncHandler(async (req, res, next) => {
    const paymentId = req.params.id;

    if (!paymentId) {
      return sendResponse(res, 400, false, "Payment ID is required");
    }

    const payment = await Payment.findByIdAndDelete(paymentId);
    if (!payment) {
      return sendResponse(res, 404, false, "Payment not found");
    }

    sendResponse(res, 200, true, "Payment deleted successfully");
  }),
};

export default paymentController;
