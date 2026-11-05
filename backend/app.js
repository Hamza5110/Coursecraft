import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
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

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  const frontendOrigin = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/$/, "");

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());
  app.use(
    cors({
      origin: frontendOrigin,
      credentials: true,
    }),
  );
  app.use(cookieParser());
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

  return app;
}
