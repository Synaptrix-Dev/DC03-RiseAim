import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
  landUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: false,
    trim: true,
    maxlength: 200,
  },
});
const Review = mongoose.model("Review", reviewSchema);
export default Review;
