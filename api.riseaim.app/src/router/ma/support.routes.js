import express from "express";
import bodyParser from "body-parser";
// import protectAPIsMiddleware from "../../middleware/protectAPI.middleware.js";
import verifyToken from "../../middleware/token.middleware.js";
import supportController from "../../controller/ma/support.controller.js";

const router = express.Router();

router.use(bodyParser.json());
// router.use(protectAPIsMiddleware);
router.use(bodyParser.urlencoded({ extended: false }));
router.use(verifyToken);

router.route("/create-ticket").post(supportController.createSupport);
router.route("/get-support-history").get(supportController.getUserSupports);

export default router;
