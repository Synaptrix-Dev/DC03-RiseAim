import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: [
        "paid",
        "incoming",
        "overdue",
        "rejected",
        "underview",
        "upcoming",
      ],
      default: "incoming",
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
