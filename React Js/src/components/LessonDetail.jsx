import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../context/AuthContext";
import {
  deleteLesson,
  getCourseBySlug,
  getLesson,
  updateLesson,
} from "../api/blogApi";
import RichTextEditor from "./RichTextEditor";
import RichTextContent from "./RichTextContent";
import { isEmptyHtml } from "../utils/html";

function isSameId(a, b) {
  if (!a || !b) return false;
  const left = typeof a === "object" ? a._id || a.id : a;
  const right = typeof b === "object" ? b._id || b.id : b;
  return String(left) === String(right);
}

function LessonDetail() {
  const { slug, lessonId } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    videoUrl: "",
    order: "1",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleted, setDeleted] = useState(false);

  const isAdmin = user?.role === "admin";
  const isOwner =
    course &&
    (isSameId(course.instructor, user?.id) ||
      isSameId(course.instructor?._id, user?.id));
  const canManage = isAdmin || (user?.role === "instructor" && isOwner);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [courseData, lessonData] = await Promise.all([
          getCourseBySlug(slug),
          getLesson(slug, lessonId),
        ]);
        setCourse(courseData.course);
        setLesson(lessonData.lesson);
        setForm({
          title: lessonData.lesson.title,
          content: lessonData.lesson.content,
          videoUrl: lessonData.lesson.videoUrl || "",
          order: String(lessonData.lesson.order),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, lessonId]);

  if (deleted) {
    return <Navigate to={`/courses/${slug}`} replace />;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.title.trim() || isEmptyHtml(form.content)) {
      setError("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const data = await updateLesson(slug, lessonId, {
        title: form.title.trim(),
        content: form.content,
        videoUrl: form.videoUrl.trim(),
        order: Number(form.order),
      });
      setLesson(data.lesson);
      setEditing(false);
      setMessage(data.message || "Lesson updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this lesson permanently?");
    if (!confirmed) return;

    setSaving(true);
    setError("");
    try {
      await deleteLesson(slug, lessonId);
      setDeleted(true);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="min-h-[70vh] bg-gray-100 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            to={`/courses/${slug}`}
            className="text-blue-600 hover:underline mb-6 inline-block"
          >
            &larr; Back to course
          </Link>

          {loading && <p className="text-gray-500">Loading lesson...</p>}
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {message && <p className="text-green-600 mb-4">{message}</p>}

          {!loading && lesson && !editing && (
            <article className="bg-white p-6 rounded-xl shadow-lg">
              <p className="text-sm text-gray-500 mb-1">
                Lesson {lesson.order}
                {course?.title ? ` · ${course.title}` : ""}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {lesson.title}
              </h1>

              {lesson.videoUrl && (
                <div className="mb-6">
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    Open video
                  </a>
                  {!/(youtube\.com|youtu\.be)/i.test(lesson.videoUrl) && (
                    <video
                      src={lesson.videoUrl}
                      controls
                      className="mt-3 w-full rounded-lg bg-black max-h-96"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}

              <RichTextContent html={lesson.content} className="mb-8" />

              {canManage && (
                <div className="flex gap-3">
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
                </div>
              )}
            </article>
          )}

          {!loading && lesson && editing && canManage && (
            <form
              onSubmit={handleUpdate}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4">Edit Lesson</h2>

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
                Order
              </label>
              <input
                name="order"
                type="number"
                min="1"
                value={form.order}
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
                required
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL (optional)
              </label>
              <input
                name="videoUrl"
                type="url"
                value={form.videoUrl}
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
                placeholder="https://..."
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <RichTextEditor
                value={form.content}
                onChange={(content) => setForm({ ...form, content })}
                placeholder="Update lesson content..."
                minHeightClass="min-h-[220px]"
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
                      title: lesson.title,
                      content: lesson.content,
                      videoUrl: lesson.videoUrl || "",
                      order: String(lesson.order),
                    });
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

export default LessonDetail;
