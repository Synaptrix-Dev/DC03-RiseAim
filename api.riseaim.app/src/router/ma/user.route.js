import express from "express";
import bodyParser from "body-parser";
import protectAPIsMiddleware from "../../middleware/protectAPI.middleware.js";
import verifyToken from "../../middleware/token.middleware.js";
import userController from "../../controller/ma/user.controller.js";

const router = express.Router();

router.use(bodyParser.json());
router.use(protectAPIsMiddleware);
router.use(bodyParser.urlencoded({ extended: false }));
router.use(verifyToken);

// * CREATING ROUTES - ADMIN AUTHENTICATION 😎
router.route("/check-user").post(userController.checkUser);
router.route("/register").post(userController.register);
router.route("/verify-otp").post(userController.verifyOTP);
router.route("/login").post(userController.login);
router.route("/reset-password").post(userController.resetPassword);
router.route("/forgot-password").post(userController.forgotPassword);
router.route("/get-user-details").get(userController.getUserDetails);
router.route("/update-user-details").patch(userController.updateUser);
router.route("/deactivate-account").patch(userController.deactivateAccount);

export default router;
