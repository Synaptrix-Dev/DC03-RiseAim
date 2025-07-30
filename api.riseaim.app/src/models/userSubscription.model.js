import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    purchasedUnit: {
      unit: {
        type: String,
        required: true,
      },
      ids: {
        type: [String],
        default: [],
      },
      qty: {
        type: Number,
        required: true,
      },
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    transaction: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    purchasedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    totalPrice: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Calculate end date and total price before saving
userSubscriptionSchema.pre("save", async function (next) {
  if (this.isNew) {
    const subscriptionPlan = await mongoose
      .model("SubscriptionPlan")
      .findById(this.subscriptionPlan);

    if (subscriptionPlan) {
      const start = new Date(this.startDate);
      this.endDate = new Date(start.setFullYear(start.getFullYear() + 1))
    }
  }
  next();
});

export default mongoose.model("UserSubscription", userSubscriptionSchema);
