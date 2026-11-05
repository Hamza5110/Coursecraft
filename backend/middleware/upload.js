import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";
import { fileTypeFromFile } from "file-type";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, _file, cb) => {
    // Temporary name; verified + renamed after magic-byte check.
    cb(null, `${crypto.randomUUID()}.tmp`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, png, webp, gif)"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Verify magic bytes, re-encode with sharp (strips polyglots), write final file.
 * Attaches req.uploadedImage = { url, filename }.
 */
export async function processUploadedImage(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided",
    });
  }

  const tmpPath = req.file.path;

  try {
    const detected = await fileTypeFromFile(tmpPath);
    if (!detected || !ALLOWED_MIME.has(detected.mime)) {
      await fs.promises.unlink(tmpPath).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "File content is not a valid image",
      });
    }

    const ext = MIME_TO_EXT[detected.mime] || ".jpg";
    const finalName = `${crypto.randomUUID()}${ext}`;
    const finalPath = path.join(uploadsDir, finalName);

    // GIF: keep as-is (sharp would flatten animation). Others: re-encode.
    if (detected.mime === "image/gif") {
      await fs.promises.rename(tmpPath, finalPath);
    } else {
      const pipeline = sharp(tmpPath).rotate();
      if (detected.mime === "image/png") {
        await pipeline.png({ compressionLevel: 8 }).toFile(finalPath);
      } else if (detected.mime === "image/webp") {
        await pipeline.webp({ quality: 82 }).toFile(finalPath);
      } else {
        await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(finalPath);
      }
      await fs.promises.unlink(tmpPath).catch(() => {});

      // Also write a 400px WebP thumbnail for cards.
      const thumbName = finalName.replace(/\.[^.]+$/, "-thumb.webp");
      await sharp(finalPath)
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(path.join(uploadsDir, thumbName));
    }

    req.uploadedImage = {
      filename: finalName,
      url: `/uploads/${finalName}`,
      thumbUrl:
        detected.mime === "image/gif"
          ? `/uploads/${finalName}`
          : `/uploads/${finalName.replace(/\.[^.]+$/, "-thumb.webp")}`,
    };
    next();
  } catch (err) {
    await fs.promises.unlink(tmpPath).catch(() => {});
    next(err);
  }
}
