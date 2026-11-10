import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createCourse } from "../api/blogApi";
import ImageUploadField from "./ImageUploadField";

function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    image: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canCreate =
    user?.role === "instructor" || user?.role === "admin";

  if (!canCreate) {
    return <Navigate to="/courses" replace />;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await createCourse({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        image: form.image.trim(),
      });
      navigate(`/courses/${data.course.slug}`);
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
            <h1 className="text-3xl font-bold">Create Course</h1>
            <Link to="/courses" className="text-blue-600 hover:underline">
              Back to Courses
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
              placeholder="Course title"
              className="w-full border p-2 rounded mb-4"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What will students learn?"
              rows={6}
              className="w-full border p-2 rounded mb-4 resize-y"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)
            </label>
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              type="number"
              min="0"
              step="0.01"
              placeholder="49"
              className="w-full border p-2 rounded mb-4"
              required
            />

            <ImageUploadField
              label="Course cover"
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
              required
            />

            <p className="text-sm text-gray-500 mb-4">
              Instructor: {user?.username || user?.email}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white rounded-md px-4 w-full py-2 hover:bg-blue-600 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Course"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

export default CreateCourse;
