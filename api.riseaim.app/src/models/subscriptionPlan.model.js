import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0,
    },
    duration: {
      type: String,
      required: true,
      default: "year",
    },
    unit: {
      type: String,
      required: true,
      enum: ["cadastral number", "administrative unit", "region", "country"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
