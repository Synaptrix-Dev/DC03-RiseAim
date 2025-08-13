import mongoose from "mongoose";

const supportSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
    },
    { timestamps: true }
);

const Support = mongoose.model("Support", supportSchema);
export default Support;
