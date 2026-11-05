import express from "express";
import { protect } from "../middleware/auth_middleware.js";
import { upload, processUploadedImage } from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rate_limit.js";

const router = express.Router();

router.post(
  "/",
  protect,
  uploadLimiter,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Upload failed",
        });
      }
      next();
    });
  },
  processUploadedImage,
  (req, res) => {
    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      url: req.uploadedImage.url,
      thumbUrl: req.uploadedImage.thumbUrl,
      filename: req.uploadedImage.filename,
    });
  },
);

export default router;
