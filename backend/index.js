import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth_route.js";
import blogRoutes from "./routes/blog_route.js";
import courseRoutes from "./routes/course_route.js";
import userRoutes from "./routes/user_route.js";
import uploadRoutes from "./routes/upload_route.js";
import { uploadsDir } from "./middleware/upload.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // Vite default
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/upload", uploadRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () =>
      console.log("Server running")
    );
  })
  .catch((err) => console.error(err));