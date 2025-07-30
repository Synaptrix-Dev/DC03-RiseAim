import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../../services/asyncHandler.js";
import sendResponse from "../../services/sendResponse.service.js";

const authController = {
  register: asyncHandler(async (req, res) => {
    const { password, email, fullName } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return sendResponse(res, 400, false, "User with this email already exists");
    }

    user = new User({ password, email, fullName });
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    sendResponse(res, 201, true, "User registered successfully", {
      email,
      token,
    });
  }),
};

export default authController;
