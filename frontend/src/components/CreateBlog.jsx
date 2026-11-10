import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createBlog } from "../api/blogApi";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "./RichTextEditor";
import { isEmptyHtml } from "../utils/html";

function CreateBlog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", content: "", coverImage: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || isEmptyHtml(form.content)) {
      setError("Title and content are required");
      return;
    }
    setLoading(true);
    try {
      await createBlog({
        title: form.title.trim(),
        content: form.content,
        coverImage: form.coverImage.trim(),
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="min-h-[70vh] bg-gray-100 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Create Blog</h1>
            <Link to="/" className="text-blue-600 hover:underline">
              Back to Home
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              type="text"
              placeholder="Blog title"
              className="w-full border p-2 rounded mb-4"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="Write your blog content..."
              minHeightClass="min-h-[220px]"
            />

            <ImageUploadField
              label="Cover image"
              value={form.coverImage}
              onChange={(coverImage) => setForm({ ...form, coverImage })}
            />

            <p className="text-sm text-gray-500 mb-4">
              Author: {user?.username || user?.email || "Anonymous"}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white rounded-md px-4 w-full py-2 hover:bg-blue-600 disabled:opacity-60"
            >
              {loading ? "Publishing..." : "Publish Blog"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

export default CreateBlog;
