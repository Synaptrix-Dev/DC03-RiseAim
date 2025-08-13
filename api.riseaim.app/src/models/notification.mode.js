import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: { type: Number, required: true },
        message: { type: Date, required: true },
        isRead: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const Notifications = mongoose.model("notifications", notificationSchema);
export default Notifications;
