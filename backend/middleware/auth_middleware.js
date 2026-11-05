import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { readAccessToken } from "../utils/cookies.js";

async function loadUserFromToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  if (decoded.purpose && decoded.purpose !== "access") {
    return null;
  }

  const user = await User.findById(decoded.id)
    .select("_id username email role passwordChangedAt")
    .lean();

  if (!user) return null;

  if (
    user.passwordChangedAt &&
    decoded.iat &&
    Math.floor(new Date(user.passwordChangedAt).getTime() / 1000) > decoded.iat
  ) {
    const err = new Error("PASSWORD_CHANGED");
    err.code = "PASSWORD_CHANGED";
    throw err;
  }

  return {
    _id: user._id,
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

export const protect = async (req, res, next) => {
  try {
    const token = readAccessToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    const user = await loadUserFromToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.code === "PASSWORD_CHANGED") {
      return res.status(401).json({
        success: false,
        message: "Password was changed. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }
    next();
  };
};

/** Optional auth — attaches user when a valid access token is present. */
export const optionalAuth = async (req, _res, next) => {
  try {
    const token = readAccessToken(req);
    if (!token) return next();
    const user = await loadUserFromToken(token);
    if (user) req.user = user;
  } catch {
    // ignore invalid optional tokens
  }
  next();
};
