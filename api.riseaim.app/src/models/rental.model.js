import mongoose from "mongoose";

const monthlyPaymentSchema = new mongoose.Schema({
  month: { type: Date, required: true },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "paid", "un-paid", "ongoing", "overdue"], default: "pending" },
});

const rentalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, default: "pending", enum: ["pending", "verified", "in-active", "closed", "rejected"] },
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
      status: { type: String, default: "un-verified", enum: ["verified", "un-verified"] },
    },
    monthlySchedule: [monthlyPaymentSchema],
  },
  { timestamps: true }
);

// Helper to update statuses
function updateMonthlyStatuses(doc) {
  if (!doc.monthlySchedule || !Array.isArray(doc.monthlySchedule)) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  doc.monthlySchedule.forEach((payment) => {
    if (!(payment.month instanceof Date)) {
      payment.month = new Date(payment.month);
    }

    const payMonth = payment.month.getMonth();
    const payYear = payment.month.getFullYear();

    if (payYear === currentYear && payMonth === currentMonth) {
      payment.status = "ongoing";
    } else if (
      (payYear < currentYear || (payYear === currentYear && payMonth < currentMonth)) &&
      payment.status !== "paid"
    ) {
      payment.status = "overdue";
    }
    // Future months keep their existing status
  });
}

// Run on every `find` or `findOne`
rentalSchema.post("init", function (doc) {
  updateMonthlyStatuses(doc);
});

// Run before save so DB always has correct statuses
rentalSchema.pre("save", function (next) {
  updateMonthlyStatuses(this);
  next();
});

const Rental = mongoose.model("Rental", rentalSchema);
export default Rental;
