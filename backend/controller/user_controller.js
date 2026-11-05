import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { clearAccessCookie } from "../utils/cookies.js";
import { deleteUserAndRelatedData } from "../utils/deleteUserData.js";
import { BCRYPT_ROUNDS, validatePassword } from "../utils/password.js";

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("username email role createdAt")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, users });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

const getUser = async (req, res) => {
  try {
    const isOwner = String(req.user._id) === String(req.params.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own profile",
      });
    }

    const user = await User.findById(req.params.id)
      .select("username email role createdAt")
      .lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const isOwner = String(req.user._id) === String(req.params.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile",
      });
    }

    const username =
      typeof req.body.username === "string" ? req.body.username.trim() : "";
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const { currentPassword } = req.body;

    if (!username || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Username and email are required" });
    }

    const user = await User.findById(req.params.id).select("+password email");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const emailChanged = email !== user.email;
    if (emailChanged && isOwner) {
      if (typeof currentPassword !== "string" || !currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to change email",
        });
      }
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    user.username = username;
    user.email = email;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email already in use" });
    }
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== "student" && role !== "instructor") {
      return res.status(400).json({
        success: false,
        message: "Role must be student or instructor",
      });
    }

    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot change an admin user's role from this endpoint",
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role updated to ${role}`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};

const changePassword = async (req, res) => {
  try {
    const isOwner = String(req.user._id) === String(req.params.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only change your own password",
      });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
      return res
        .status(400)
        .json({ success: false, message: passwordCheck.message });
    }

    const user = await User.findById(req.params.id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const match = await bcrypt.compare(String(currentPassword), user.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const sameAsOld = await bcrypt.compare(String(newPassword), user.password);
    if (sameAsOld) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    user.password = await bcrypt.hash(String(newPassword), BCRYPT_ROUNDS);
    user.passwordChangedAt = new Date();
    await user.save();

    clearAccessCookie(res);

    res.status(200).json({
      success: true,
      message: "Password updated successfully. Please log in again.",
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account from this endpoint",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an admin user",
      });
    }

    await deleteUserAndRelatedData(user._id);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

export {
  getAllUsers,
  getUser,
  updateUser,
  updateUserRole,
  changePassword,
  deleteUser,
};
