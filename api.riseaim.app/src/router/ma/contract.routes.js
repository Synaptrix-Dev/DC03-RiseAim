import express from "express";
import bodyParser from "body-parser";
import protectAPIsMiddleware from "../../middleware/protectAPI.middleware.js";
import verifyToken from "../../middleware/token.middleware.js";
import contractController from "../../controller/ma/contract.controller.js";

const router = express.Router();

router.use(bodyParser.json());
router.use(protectAPIsMiddleware);
router.use(bodyParser.urlencoded({ extended: false }));
router.use(verifyToken);

router.route("/").post(contractController.createContract);
router
  .route("/:id")
  .get(contractController.getContract)
  .patch(contractController.updateContract)
  .delete(contractController.deleteContract);

export default router;
