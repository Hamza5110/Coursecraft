import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";

const createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const blog = await Blog.create({ title, content, author: req.user.id, authorName: req.user.username });
    res.status(201).json({ success: true, message: "Blog created", blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAllBlogs = async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};

    if (search && String(search).trim()) {
      filter.title = {
        $regex: escapeRegex(String(search).trim()),
        $options: "i",
      };
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("author", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      blogs,
      pagination: buildPagination({ page, limit, total }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "username email");
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    const isOwner = String(blog.author) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if(!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You can only edit your own blogs" });
    }

    const { title, content } = req.body;
    if(title !== undefined) blog.title = title;
    if(content !== undefined) blog.content = content;
    await blog.save();

    res.status(200).json({ success: true, message: "Blog updated", blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const isOwner = String(blog.author) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if(!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You can only delete your own blogs" });
    }

    await Comment.deleteMany({ blog: blog._id });
    await blog.deleteOne();
    res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog };
