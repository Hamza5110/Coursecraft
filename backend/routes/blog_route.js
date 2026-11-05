import express from "express";
import { optionalAuth, protect } from "../middleware/auth_middleware.js";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleBlogLike,
  getLikedBlogs,
} from "../controller/blog_controller.js";
import {
  getCommentsByBlog,
  createComment,
  deleteComment,
} from "../controller/comment_controller.js";

const router = express.Router();

router.get("/all", optionalAuth, getAllBlogs);
router.get("/liked", protect, getLikedBlogs);

router.get("/:id/comments", getCommentsByBlog);
router.post("/:id/comments", protect, createComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);
router.post("/:id/like", protect, toggleBlogLike);

router.get("/:id", optionalAuth, getBlogById);
router.post("/create", protect, createBlog);
router.put("/:id", protect, updateBlog);
router.delete("/:id", protect, deleteBlog);

export default router;
