import mongoose from "mongoose";
import dotenv from "dotenv";
import { createApp } from "./app.js";

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

const app = createApp();

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
