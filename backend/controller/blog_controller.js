import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";
import { sanitizeContent } from "../utils/sanitize.js";
import { buildExcerpt } from "../utils/excerpt.js";
import { assertSafeMediaUrl } from "../utils/urls.js";

const LIST_SELECT =
  "title excerpt coverImage author authorName createdAt likesCount likedBy";

const createBlog = async (req, res) => {
  try {
    const { title, content, coverImage } = req.body;
    if (!title || !content) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const safeContent = sanitizeContent(content);
    if (!safeContent.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });
    }

    const image = coverImage?.trim() || "";
    if (image) assertSafeMediaUrl(image, "Cover image");

    const blog = await Blog.create({
      title: String(title).trim().slice(0, 200),
      content: safeContent,
      excerpt: buildExcerpt(safeContent),
      coverImage: image,
      author: req.user.id,
      authorName: req.user.username,
    });

    res.status(201).json({ success: true, message: "Blog created", blog });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? "Failed to create blog" : err.message,
    });
  }
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mapListBlog = (blog, userId) => {
  const obj = blog.toObject ? blog.toObject() : { ...blog };
  const likedBy = obj.likedBy || [];
  return {
    _id: obj._id,
    title: obj.title,
    excerpt: obj.excerpt || "",
    coverImage: obj.coverImage || "",
    author: obj.author,
    authorName: obj.authorName,
    createdAt: obj.createdAt,
    likesCount: obj.likesCount ?? likedBy.length,
    liked: userId
      ? likedBy.some((id) => String(id) === String(userId))
      : false,
  };
};

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
        .select(LIST_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    const userId = req.user?._id;
    res.status(200).json({
      success: true,
      blogs: blogs.map((b) => mapListBlog(b, userId)),
      pagination: buildPagination({ page, limit, total }),
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch blogs" });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author", "username")
      .lean();
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const userId = req.user?._id;
    const likedBy = blog.likedBy || [];
    res.status(200).json({
      success: true,
      blog: {
        ...blog,
        likesCount: blog.likesCount ?? likedBy.length,
        liked: userId
          ? likedBy.some((id) => String(id) === String(userId))
          : false,
        likedBy: undefined,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch blog" });
  }
};

const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    const isOwner = String(blog.author) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own blogs",
      });
    }

    const { title, content, coverImage } = req.body;
    if (title !== undefined) blog.title = String(title).trim().slice(0, 200);
    if (content !== undefined) {
      const safeContent = sanitizeContent(content);
      if (!safeContent.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Content is required" });
      }
      blog.content = safeContent;
      blog.excerpt = buildExcerpt(safeContent);
    }
    if (coverImage !== undefined) {
      const image = String(coverImage).trim();
      if (image) assertSafeMediaUrl(image, "Cover image");
      blog.coverImage = image;
    }
    await blog.save();

    res.status(200).json({ success: true, message: "Blog updated", blog });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? "Failed to update blog" : err.message,
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const isOwner = String(blog.author) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own blogs",
      });
    }

    await Promise.all([
      Comment.deleteMany({ blog: blog._id }),
      blog.deleteOne(),
    ]);
    res.status(200).json({ success: true, message: "Blog deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete blog" });
  }
};

const toggleBlogLike = async (req, res) => {
  try {
    const userId = req.user._id;
    const blog = await Blog.findById(req.params.id).select("likedBy likesCount");
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const alreadyLiked = blog.likedBy.some((id) => id.equals(userId));

    const updated = alreadyLiked
      ? await Blog.findByIdAndUpdate(
          blog._id,
          { $pull: { likedBy: userId }, $inc: { likesCount: -1 } },
          { returnDocument: "after" },
        ).select("likedBy likesCount")
      : await Blog.findByIdAndUpdate(
          blog._id,
          { $addToSet: { likedBy: userId }, $inc: { likesCount: 1 } },
          { returnDocument: "after" },
        ).select("likedBy likesCount");

    // Keep likesCount non-negative if data was inconsistent.
    if (updated.likesCount < 0) {
      updated.likesCount = updated.likedBy.length;
      await updated.save();
    }

    const liked = !alreadyLiked;
    res.status(200).json({
      success: true,
      message: liked ? "Blog liked" : "Blog unliked",
      liked,
      likesCount: updated.likesCount,
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to toggle like" });
  }
};

const getLikedBlogs = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { likedBy: req.user._id };

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .select(LIST_SELECT)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      blogs: blogs.map((b) => mapListBlog(b, req.user._id)),
      pagination: buildPagination({ page, limit, total }),
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch liked blogs" });
  }
};

export {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleBlogLike,
  getLikedBlogs,
};
