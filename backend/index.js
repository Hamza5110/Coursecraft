import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import authRoutes from "./routes/auth_route.js";
import blogRoutes from "./routes/blog_route.js";
import courseRoutes from "./routes/course_route.js";
import userRoutes from "./routes/user_route.js";
import uploadRoutes from "./routes/upload_route.js";
import { uploadsDir } from "./middleware/upload.js";
import { apiLimiter } from "./middleware/rate_limit.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error_handler.js";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  console.error(
    "FATAL: JWT_SECRET must be set and at least 32 characters. Generate with: openssl rand -hex 32",
  );
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !process.env.SMTP_HOST) {
  console.error("FATAL: SMTP_HOST is required in production");
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");

const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);
app.use(compression());
app.use(
  cors({
    origin: frontendOrigin.replace(/\/$/, ""),
  }),
);
app.use(express.json({ limit: "200kb" }));
app.use(
  "/uploads",
  express.static(uploadsDir, {
    maxAge: "30d",
    immutable: true,
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", "inline");
    },
  }),
);

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/upload", uploadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () =>
      console.log("Server running"),
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
