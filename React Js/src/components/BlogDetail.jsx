import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../context/AuthContext";
import {
  createComment,
  deleteBlog,
  deleteComment,
  getBlogById,
  getBlogComments,
  toggleBlogLike,
  updateBlog,
} from "../api/blogApi";

function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blog, setBlog] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getBlogById(id);
        setBlog(data.blog);
        setForm({
          title: data.blog.title,
          content: data.blog.content,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBlog();
  }, [id]);

  useEffect(() => {
    const loadComments = async () => {
      setCommentsLoading(true);
      setCommentsError("");
      try {
        const data = await getBlogComments(id);
        setComments(data.comments || []);
      } catch (err) {
        setCommentsError(err.message);
      } finally {
        setCommentsLoading(false);
      }
    };
    loadComments();
  }, [id]);

  const isOwner =
    blog && String(blog.author?._id || blog.author) === String(user?.id);
  const isAdmin = user?.role === "admin";
  const canManage = isOwner || isAdmin;
  const likesCount = blog?.likedBy?.length || 0;
  const liked =
    blog?.likedBy?.some(
      (id) => String(id?._id || id) === String(user?.id),
    ) || false;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await updateBlog(id, {
        title: form.title.trim(),
        content: form.content.trim(),
      });
      setBlog(data.blog);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this blog permanently?");
    if (!confirmed) return;

    setSaving(true);
    setError("");
    try {
      await deleteBlog(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleToggleLike = async () => {
    setLiking(true);
    setError("");
    try {
      const data = await toggleBlogLike(id);
      setBlog(data.blog);
    } catch (err) {
      setError(err.message);
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSavingComment(true);
    setCommentsError("");
    try {
      const data = await createComment(id, { content: commentText.trim() });
      setComments((prev) => [data.comment, ...prev]);
      setCommentText("");
    } catch (err) {
      setCommentsError(err.message);
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteComment = async (comment) => {
    const commentId = comment._id;
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    setDeletingCommentId(commentId);
    setCommentsError("");
    try {
      await deleteComment(id, commentId);
      setComments((prev) =>
        prev.filter((item) => String(item._id) !== String(commentId)),
      );
    } catch (err) {
      setCommentsError(err.message);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const canDeleteComment = (comment) => {
    const authorId = comment.author?._id || comment.author;
    return isAdmin || String(authorId) === String(user?.id);
  };

  return (
    <>
      <Navbar />
      <section className="min-h-[70vh] bg-gray-100 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            to="/"
            className="text-blue-600 hover:underline mb-6 inline-block"
          >
            &larr; Back to Home
          </Link>

          {loading && <p className="text-gray-500">Loading blog...</p>}
          {error && <p className="text-red-500 mb-4">{error}</p>}

          {!loading && blog && !editing && (
            <article className="bg-white p-6 rounded-xl shadow-lg">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {blog.title}
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                By {blog.authorName || blog.author?.username || "Unknown"}
                {blog.createdAt &&
                  ` · ${new Date(blog.createdAt).toLocaleDateString()}`}
              </p>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-8">
                {blog.content}
              </p>

              <div className="flex flex-wrap gap-3 mb-2">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={liking}
                  className={`px-4 py-2 rounded-lg disabled:opacity-60 ${
                    liked
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {liking
                    ? "Updating..."
                    : liked
                      ? `Liked · ${likesCount}`
                      : `Like · ${likesCount}`}
                </button>
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </article>
          )}

          {!loading && blog && editing && canManage && (
            <form
              onSubmit={handleUpdate}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4">Edit Blog</h2>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
                required
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={10}
                className="w-full border p-2 rounded mb-4 resize-y"
                required
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      title: blog.title,
                      content: blog.content,
                    });
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!loading && blog && !editing && (
            <section className="mt-8 bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4">
                Comments ({comments.length})
              </h2>

              <form onSubmit={handleAddComment} className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add a comment
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className="w-full border p-2 rounded mb-3 resize-y"
                  placeholder="Share your thoughts..."
                  required
                />
                <button
                  type="submit"
                  disabled={savingComment || !commentText.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {savingComment ? "Posting..." : "Post Comment"}
                </button>
              </form>

              {commentsLoading && (
                <p className="text-gray-500">Loading comments...</p>
              )}
              {commentsError && (
                <p className="text-red-500 mb-4">{commentsError}</p>
              )}
              {!commentsLoading && comments.length === 0 && !commentsError && (
                <p className="text-gray-500">No comments yet. Be the first.</p>
              )}

              <ul className="space-y-4">
                {comments.map((comment) => (
                  <li
                    key={comment._id}
                    className="border border-gray-100 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {comment.authorName ||
                            comment.author?.username ||
                            "User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {comment.createdAt &&
                            new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {canDeleteComment(comment) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment)}
                          disabled={deletingCommentId === comment._id}
                          className="text-sm text-red-600 hover:text-red-700 disabled:opacity-60"
                        >
                          {deletingCommentId === comment._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

export default BlogDetail;
