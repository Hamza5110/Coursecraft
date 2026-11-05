import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      default: "",
      maxlength: 300,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: "",
      trim: true,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

blogSchema.index({ createdAt: -1 });
blogSchema.index({ likedBy: 1, updatedAt: -1 });
blogSchema.index({ title: "text" });

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
