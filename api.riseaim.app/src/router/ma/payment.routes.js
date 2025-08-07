import express from "express";
import bodyParser from "body-parser";
import protectAPIsMiddleware from "../../middleware/protectAPI.middleware.js";
import verifyToken from "../../middleware/token.middleware.js";
import paymentController from "../../controller/ma/payment.controller.js";

const router = express.Router();

router.use(bodyParser.json());
router.use(protectAPIsMiddleware);
router.use(bodyParser.urlencoded({ extended: false }));
router.use(verifyToken);

router.route("/").post(paymentController.createPayment);
router
  .route("/:id")
  .get(paymentController.getPayment)
  .patch(paymentController.updatePayment)
  .delete(paymentController.deletePayment);

export default router;
