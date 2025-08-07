import express from "express";
import bodyParser from "body-parser";
import protectAPIsMiddleware from "../../middleware/protectAPI.middleware.js";
import verifyToken from "../../middleware/token.middleware.js";
import rentalController from "../../controller/ma/rental.controller.js";

const router = express.Router();

router.use(bodyParser.json());
router.use(protectAPIsMiddleware);
router.use(bodyParser.urlencoded({ extended: false }));
router.use(verifyToken);

router.route("/").post(rentalController.createRental);
router
  .route("/:id")
  .get(rentalController.getRental)
  .patch(rentalController.updateRental)
  .delete(rentalController.deleteRental);

export default router;
