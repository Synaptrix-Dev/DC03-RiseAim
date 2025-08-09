import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../../services/asyncHandler.service.js";
import sendResponse from "../../services/sendResponse.service.js";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const authController = {
  checkUser: asyncHandler(async (req, res, next) => {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return sendResponse(res, 400, false, "All fields are required");
    }

    let user = await User.findOne({ phone });
    if (user) {
      return sendResponse(res, 400, false, "User already exist in database");
    }

    sendResponse(res, 201, true, "User Does not exist, redirecting to OTP",);
  }),

  register: asyncHandler(async (req, res, next) => {
    const { fullName, email, phone, password, isOTPVerified } = req.body;

    if (!fullName || !email || !phone || !password) {
      return sendResponse(res, 400, false, "All fields are required");
    }

    if (!isOTPVerified) {
      return sendResponse(res, 403, false, "OTP verification is required");
    }

    let user = await User.findOne({ phone });

    user = new User({
      fullName,
      email,
      phone,
      password,
      status: "active",
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isActive: user.status,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    sendResponse(res, 201, true, "User registered, OTP sent for verification", {
      email,
      token,
    });
  }),

  verifyOTP: asyncHandler(async (req, res, next) => {
    const { otp, phone } = req.body;

    if (!otp || !phone) {
      return sendResponse(res, 400, false, "OTP and phone are required");
    }

    const user = await User.findOne({ phone: phone });
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (user.status !== "in-active") {
      return sendResponse(res, 400, false, "Account already verified or invalid status");
    }

    if (user.otp !== otp) {
      return sendResponse(res, 400, false, "Invalid OTP");
    }

    user.status = "active";
    user.otp = undefined; // remove OTP after successful verification
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        isActive: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return sendResponse(res, 200, true, "OTP verified, account activated", {
      email: user.email,
      phone: user.phone,
      token,
    });
  }),

  login: asyncHandler(async (req, res, next) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return sendResponse(res, 400, false, "phone and password are required");
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return sendResponse(res, 400, false, "No user found with this phone");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendResponse(res, 400, false, "Invalid credentials");
    }

    // if (user.status !== "active") {
    //   return sendResponse(res, 403, false, "Account is not active");
    // }

    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone, // ✅ phone is already here
        isActive: user.status === "active",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    sendResponse(res, 200, true, "Login successful", {
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      token,
    });
  }),

  forgotPassword: asyncHandler(async (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
      return sendResponse(res, 400, false, "phone is required");
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return sendResponse(res, 404, false, "No user found with this phone");
    }

    // const otp = generateOTP();

    const resetToken = jwt.sign(
      { id: user._id, email: user.email, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    sendResponse(res, 200, true, "Password reset OTP sent", {
      resetToken,
    });
  }),

  resetPassword: asyncHandler(async (req, res, next) => {
    const { resetToken, newPassword, isOTPVerified } = req.body;

    if (!resetToken || !newPassword) {
      return sendResponse(res, 400, false, "Reset token, OTP, and new password are required");
    }

    if (!isOTPVerified) {
      return sendResponse(res, 403, false, "OTP verification is required");
    }

    try {
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return sendResponse(res, 404, false, "User not found");
      }

      user.password = newPassword;
      await user.save();

      sendResponse(res, 200, true, "Password reset successfully");
    } catch (error) {
      return sendResponse(res, 401, false, "Invalid or expired reset token");
    }
  }),

  resetOrForgotPassword: asyncHandler(async (req, res, next) => {
    const { phone, newPassword, isOTPVerified } = req.body;

    if (!phone) {
      return sendResponse(res, 400, false, "Phone is required");
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return sendResponse(res, 404, false, "No user found with this phone");
    }

    // If OTP not verified → send OTP response (no password change)
    if (!isOTPVerified) {
      // const otp = generateOTP();  // Generate OTP if you have that function
      // TODO: Send OTP via SMS/email here
      return sendResponse(res, 200, true, "Password reset OTP sent");
    }

    // OTP is verified → reset password
    if (!newPassword) {
      return sendResponse(res, 400, false, "New password is required");
    }

    user.password = newPassword;
    await user.save();

    return sendResponse(res, 200, true, "Password reset successfully");
  }),


  getUserDetails: asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    if (!userId) {
      return sendResponse(res, 400, false, "User ID is required");
    }

    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    sendResponse(res, 200, true, "User details retrieved", user);
  }),

  updateUser: asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { fullName } = req.body;

    if (!userId) {
      return sendResponse(res, 400, false, "User ID is required");
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;

    if (Object.keys(updateData).length === 0) {
      return sendResponse(res, 400, false, "No data provided for update");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return sendResponse(res, 404, false, "User not found");
    }

    // ✅ Generate updated token with phone included
    const updatedToken = jwt.sign(
      {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        isActive: updatedUser.status === "active",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    sendResponse(res, 200, true, "User updated successfully", {
      user: updatedUser,
      token: updatedToken
    });
  }),

  deactivateAccount: asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    if (!userId) {
      return sendResponse(res, 400, false, "User ID is required");
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status: "in-active" },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    sendResponse(res, 200, true, "Account deactivated successfully");
  }),
};

export default authController;