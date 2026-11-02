import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/email.js";

const signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }
    if (role !== "student" && role !== "instructor") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role" });
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed, role });

    res.status(201).json({
      success: true,
      message: "User created",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const expiresIn = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      expiresIn,
      user: {id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const genericMessage =
      "If an account exists for that email, a reset link has been sent.";

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const resetToken = jwt.sign(
      { id: user._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await sendMail({
      to: user.email,
      subject: "Reset your Blog Verse password",
      text: `Reset your password using this link (expires in 15 minutes):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Reset your password using this link (expires in <strong>15 minutes</strong>):</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>If you did not request this, you can ignore this email.</p>`,
    });

    res.status(200).json({ success: true, message: genericMessage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can log in now.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export { signup, login, forgotPassword, resetPassword };
