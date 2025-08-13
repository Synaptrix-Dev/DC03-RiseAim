import express from "express";
import userRouter from "./user.route.js";
import rentalRouter from "./rental.routes.js";
import paymentRouter from "./payment.routes.js";
import contractRouter from "./contract.routes.js";
import supportRouter from './support.routes.js'

const router = express.Router();

router.use("/user", userRouter);
router.use("/rental", rentalRouter);
router.use("/payment", paymentRouter);
router.use("/contract", contractRouter);
router.use("/support", supportRouter);

export default router;
