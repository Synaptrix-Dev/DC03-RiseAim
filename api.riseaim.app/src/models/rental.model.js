import mongoose from "mongoose";

const monthlyPaymentSchema = new mongoose.Schema({
  month: { type: String, required: true }, // e.g., "Aug 2025"
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "paid", "un-paid"], default: "pending" },
});

const rentalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, default: "pending", enum: ["pending", "verified", "in-active"] },
    annualRentAmount: { type: Number, required: true },
    alreadyPaidAmount: { type: Number, required: true },
    monthlyInstallment: { type: Number, default: 0 },
    interest: { type: Number, required: true, default: 20 },
    dueAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    attachment: { type: String },
    city: { type: String, required: true },
    neighborhood: { type: String, required: true },
    propertyOwners: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },
    monthlySchedule: [monthlyPaymentSchema], // 12 months data
  },
  { timestamps: true }
);

const Rental = mongoose.model("Rental", rentalSchema);
export default Rental;
