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
router.route("/register").post(userController.register);
export default router;
