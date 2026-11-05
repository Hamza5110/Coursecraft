import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (decoded.purpose && decoded.purpose !== "access") {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token purpose",
      });
    }

    const user = await User.findById(decoded.id)
      .select("_id username email role passwordChangedAt")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.passwordChangedAt &&
      decoded.iat &&
      Math.floor(new Date(user.passwordChangedAt).getTime() / 1000) > decoded.iat
    ) {
      return res.status(401).json({
        success: false,
        message: "Password was changed. Please log in again.",
      });
    }

    req.user = {
      _id: user._id,
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    next();
  } catch {
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (decoded.purpose && decoded.purpose !== "access") {
      return next();
    }
    const user = await User.findById(decoded.id)
      .select("_id username email role passwordChangedAt")
      .lean();
    if (
      user &&
      !(
        user.passwordChangedAt &&
        decoded.iat &&
        Math.floor(new Date(user.passwordChangedAt).getTime() / 1000) >
          decoded.iat
      )
    ) {
      req.user = {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
    }
  } catch {
    // ignore invalid optional tokens
  }
  next();
};
