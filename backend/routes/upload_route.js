import express from "express";
import { protect } from "../middleware/auth_middleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Upload failed",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      url,
      filename: req.file.filename,
    });
  });
});

export default router;
