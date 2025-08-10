import express from "express";
import bodyParser from "body-parser";
import verifyToken from "../../middleware/token.middleware.js";
import rentalController from "../../controller/ma/rental.controller.js";

const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(verifyToken);

router.route("/add-rental-application").post(rentalController.createRental);
router.route("/get-rental-applications").get(rentalController.getRental);
router.route("/get-rental-applications-by-filter").get(rentalController.getByFilterUserRental);
router.route("/get-rental-applications-by-id").get(rentalController.getRentalById);
router.route("/pay-installment").patch(rentalController.updateMonthlyBreakdown);
router.route("/get-owner-contacts").get(rentalController.getUserRentalApplicationsWithOwner);

export default router;
