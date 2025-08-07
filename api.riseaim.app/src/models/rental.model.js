import mongoose from "mongoose";

const rentalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rentAmount: { type: Number, required: true },
    amountPaid: { type: Number },
    attachment: { type: String }, // Store file path or URL for PDF/image
    city: { type: String, required: true },
    neighborhood: { type: String, required: true },
    propertyOwners: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },
  },
  { timestamps: true }
);

const Rental = mongoose.model("Rental", rentalSchema);
export default Rental;
