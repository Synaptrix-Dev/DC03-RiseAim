import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contractorName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    location: { type: String, required: true },
  },
  { timestamps: true }
);

const Contract = mongoose.model("Contract", contractSchema);
export default Contract;
