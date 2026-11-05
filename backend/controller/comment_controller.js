import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";

export const getCommentsByBlog = async (req, res) => {
  try {
    const exists = await Blog.exists({ _id: req.params.id });
    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const comments = await Comment.find({ blog: req.params.id })
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.status(200).json({ success: true, comments });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch comments" });
  }
};

export const createComment = async (req, res) => {
  try {
    const exists = await Blog.exists({ _id: req.params.id });
    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Comment content is required" });
    }

    const comment = await Comment.create({
      blog: req.params.id,
      author: req.user._id,
      authorName: req.user.username,
      content: String(content).trim().slice(0, 2000),
    });

    await comment.populate("author", "username");

    res.status(201).json({
      success: true,
      message: "Comment added",
      comment,
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to create comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    if (String(comment.blog) !== String(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Comment not found on this blog",
      });
    }

    const isOwner = String(comment.author) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    await comment.deleteOne();
    res.status(200).json({
      success: true,
      message: "Comment deleted",
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete comment" });
  }
};
