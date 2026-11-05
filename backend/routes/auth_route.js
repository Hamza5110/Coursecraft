import express from "express";
import {
  signup,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
} from "../controller/auth_controller.js";
import { protect } from "../middleware/auth_middleware.js";
import {
  authLimiter,
  forgotPasswordLimiter,
} from "../middleware/rate_limit.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, me);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
