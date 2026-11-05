import express from "express";
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
} from "../controller/auth_controller.js";
import {
  authLimiter,
  forgotPasswordLimiter,
} from "../middleware/rate_limit.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
