import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/email.js";
import { BCRYPT_ROUNDS, validatePassword } from "../utils/password.js";
import {
  clearAccessCookie,
  setAccessCookie,
} from "../utils/cookies.js";

const ACCESS_TOKEN_TTL = "7d";
const ACCESS_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;

function signAccessToken(userId) {
  return jwt.sign(
    { id: userId, purpose: "access" },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL, algorithm: "HS256" },
  );
}

function shapeUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) {
      return res
        .status(400)
        .json({ success: false, message: passwordCheck.message });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail }).select("_id");
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Email already used" });
    }

    const hashed = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
    // Role is always student at signup; admins promote instructors.
    const user = await User.create({
      username: String(username).trim(),
      email: normalizedEmail,
      password: hashed,
      role: "student",
    });

    res.status(201).json({
      success: true,
      message: "User created",
      user: shapeUser(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email already used" });
    }
    res.status(500).json({ success: false, message: "Signup failed" });
  }
};

const login = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = req.body.password;

    if (!email || typeof password !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = signAccessToken(user._id);
    setAccessCookie(res, token);

    res.json({
      success: true,
      message: "Login successful",
      expiresIn: new Date(Date.now() + ACCESS_TOKEN_MS),
      user: shapeUser(user),
    });
  } catch {
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

const logout = async (_req, res) => {
  clearAccessCookie(res);
  res.status(200).json({ success: true, message: "Logged out" });
};

const me = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

const forgotPassword = async (req, res) => {
  const genericMessage =
    "If an account exists for that email, a reset link has been sent.";

  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("_id email");

    // Always respond the same way; send mail asynchronously to avoid timing leaks.
    res.status(200).json({ success: true, message: genericMessage });

    if (!user) return;

    const resetToken = jwt.sign(
      { id: user._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m", algorithm: "HS256" },
    );

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    sendMail({
      to: user.email,
      subject: "Reset your Blog Verse password",
      text: `Reset your password using this link (expires in 15 minutes):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Reset your password using this link (expires in <strong>15 minutes</strong>):</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>If you did not request this, you can ignore this email.</p>`,
    }).catch((err) => console.error("[email] forgot-password failed:", err.message));
  } catch (err) {
    if (res.headersSent) {
      console.error("[forgotPassword]", err.message);
      return;
    }
    res.status(500).json({ success: false, message: "Request failed" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
      return res
        .status(400)
        .json({ success: false, message: passwordCheck.message });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    if (decoded.purpose !== "password-reset" || !decoded.id) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const user = await User.findById(decoded.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.passwordChangedAt &&
      decoded.iat &&
      Math.floor(user.passwordChangedAt.getTime() / 1000) >= decoded.iat
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = await bcrypt.hash(String(newPassword), BCRYPT_ROUNDS);
    user.passwordChangedAt = new Date();
    await user.save();

    clearAccessCookie(res);

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can log in now.",
    });
  } catch {
    res.status(500).json({ success: false, message: "Reset failed" });
  }
};

export { signup, login, logout, me, forgotPassword, resetPassword };
