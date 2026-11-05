import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createCourseReview,
  createLesson,
  deleteCourse,
  deleteCourseReview,
  enrollInCourse,
  getCourseBySlug,
  getCourseLessons,
  getCourseReviews,
  mediaUrl,
  unenrollFromCourse,
  updateCourse,
  updateCourseReview,
} from "../api/blogApi";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "./RichTextEditor";
import StarRating from "./StarRating";
import { isEmptyHtml } from "../utils/html";

function isSameId(a, b) {
  if (!a || !b) return false;
  const left = typeof a === "object" ? a._id || a.id : a;
  const right = typeof b === "object" ? b._id || b.id : b;
  return String(left) === String(right);
}

function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsError, setLessonsError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    image: "",
  });
  const [lessonForm, setLessonForm] = useState({
    title: "",
    content: "",
    videoUrl: "",
    order: "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [editingReview, setEditingReview] = useState(false);

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";
  const isOwner =
    course &&
    (isSameId(course.instructor, user?.id) ||
      isSameId(course.instructor?._id, user?.id));
  const canManage = isAdmin || (user?.role === "instructor" && isOwner);
  const enrolled = Boolean(course?.enrolled);
  const canViewLessons = canManage || enrolled;
  const myReview =
    reviews.find((review) => isSameId(review.author, user?.id)) || null;
  const canReview = isStudent && enrolled;

  const loadLessons = async () => {
    setLessonsError("");
    try {
      const data = await getCourseLessons(slug);
      setLessons(data.lessons || []);
    } catch (err) {
      setLessons([]);
      setLessonsError(err.message);
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    setReviewsError("");
    try {
      const data = await getCourseReviews(slug);
      setReviews(data.reviews || []);
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              averageRating: data.averageRating ?? prev.averageRating,
              reviewCount: data.reviewCount ?? prev.reviewCount,
            }
          : prev,
      );
    } catch (err) {
      setReviewsError(err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getCourseBySlug(slug);
        setCourse(data.course);
        setForm({
          title: data.course.title,
          description: data.course.description,
          price: String(data.course.price),
          image: data.course.image,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!myReview) {
      setReviewRating(5);
      setReviewContent("");
      setEditingReview(false);
      return;
    }
    setReviewRating(myReview.rating);
    setReviewContent(myReview.content || "");
  }, [myReview]);

  useEffect(() => {
    if (!course?._id) return;
    if (canViewLessons) {
      loadLessons();
    } else {
      setLessons([]);
      setLessonsError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?._id, canViewLessons, slug]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLessonChange = (e) => {
    setLessonForm({ ...lessonForm, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await updateCourse(slug, {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        image: form.image.trim(),
      });
      setCourse(data.course);
      setEditing(false);
      setMessage("Course updated");
      if (data.course.slug !== slug) {
        navigate(`/courses/${data.course.slug}`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this course permanently?");
    if (!confirmed) return;

    setSaving(true);
    setError("");
    try {
      await deleteCourse(slug);
      navigate("/courses");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login", {
        state: { from: { pathname: `/courses/${slug}` } },
      });
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await enrollInCourse(slug);
      setCourse(data.course);
      setMessage(data.message || "Enrolled successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUnenroll = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await unenrollFromCourse(slug);
      setCourse(data.course);
      setLessons([]);
      setMessage(data.message || "Unenrolled successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!lessonForm.title.trim() || isEmptyHtml(lessonForm.content)) {
      setError("Lesson title and content are required");
      return;
    }
    setSavingLesson(true);
    try {
      const payload = {
        title: lessonForm.title.trim(),
        content: lessonForm.content,
        videoUrl: lessonForm.videoUrl.trim(),
      };
      if (lessonForm.order !== "") {
        payload.order = Number(lessonForm.order);
      }
      await createLesson(slug, payload);
      setLessonForm({ title: "", content: "", videoUrl: "", order: "" });
      setMessage("Lesson added");
      await loadLessons();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingLesson(false);
    }
  };

  const applyReviewStats = (data) => {
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            averageRating: data.averageRating ?? prev.averageRating,
            reviewCount: data.reviewCount ?? prev.reviewCount,
          }
        : prev,
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSavingReview(true);
    setError("");
    setMessage("");
    try {
      if (myReview) {
        const data = await updateCourseReview(slug, myReview._id, {
          rating: reviewRating,
          content: reviewContent,
        });
        setReviews((prev) =>
          prev.map((r) => (r._id === data.review._id ? data.review : r)),
        );
        applyReviewStats(data);
        setEditingReview(false);
        setMessage(data.message || "Review updated");
      } else {
        const data = await createCourseReview(slug, {
          rating: reviewRating,
          content: reviewContent,
        });
        setReviews((prev) => [data.review, ...prev]);
        applyReviewStats(data);
        setMessage(data.message || "Review added");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async (review) => {
    const confirmed = window.confirm("Delete this review?");
    if (!confirmed) return;

    setDeletingReviewId(review._id);
    setError("");
    try {
      const data = await deleteCourseReview(slug, review._id);
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
      applyReviewStats(data);
      setMessage(data.message || "Review deleted");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const canDeleteReview = (review) =>
    isAdmin || isSameId(review.author, user?.id);

  const instructorName =
    course?.instructor?.username ||
    course?.instructor?.email ||
    (typeof course?.instructor === "string" ? "Instructor" : "Unknown");

  return (
    <>
      <section className="min-h-[70vh] bg-gray-100 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            to="/courses"
            className="text-blue-600 hover:underline mb-6 inline-block"
          >
            &larr; Back to Courses
          </Link>

          {loading && <p className="text-gray-500">Loading course...</p>}
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {message && <p className="text-green-600 mb-4">{message}</p>}

          {!loading && course && !editing && (
            <article className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={mediaUrl(course.image)}
                alt={course.title}
                className="w-full h-56 object-cover bg-gray-200"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h1>
                <p className="text-sm text-gray-500 mb-2">
                  By {instructorName}
                  {course.createdAt &&
                    ` · ${new Date(course.createdAt).toLocaleDateString()}`}
                </p>
                <p className="mb-2 text-2xl font-semibold text-blue-700">
                  {Number(course.price) === 0
                    ? "Free"
                    : `$${course.price}`}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <StarRating
                    value={Math.round(course.averageRating || 0)}
                    readOnly
                    size="sm"
                  />
                  <span className="text-sm text-gray-600">
                    {course.reviewCount > 0
                      ? `${Number(course.averageRating || 0).toFixed(1)} · ${course.reviewCount} review${course.reviewCount === 1 ? "" : "s"}`
                      : "No reviews yet"}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
                  {course.description}
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  {course.studentCount || 0} student
                  {(course.studentCount || 0) === 1 ? "" : "s"} enrolled
                  <span className="ml-2 text-xs text-gray-400">
                    (enrollment is free)
                  </span>
                </p>

                <div className="flex flex-wrap gap-3">
                  {(!user || isStudent) && !enrolled && (
                    <button
                      type="button"
                      onClick={handleEnroll}
                      disabled={saving}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {saving ? "Enrolling..." : user ? "Enroll free" : "Log in to enroll"}
                    </button>
                  )}
                  {isStudent && enrolled && (
                    <button
                      type="button"
                      onClick={handleUnenroll}
                      disabled={saving}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                    >
                      {saving ? "Updating..." : "Unenroll"}
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Edit
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          )}

          {!loading && course && !editing && (
            <section className="mt-8 bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Lessons</h2>

              {!canViewLessons && (
                <p className="text-gray-500">
                  Enroll in this course to open lessons.
                </p>
              )}

              {canViewLessons && lessonsError && (
                <p className="text-red-500 mb-4">{lessonsError}</p>
              )}

              {canViewLessons && !lessonsError && lessons.length === 0 && (
                <p className="text-gray-500 mb-4">
                  No lessons yet.
                  {canManage && " Add the first lesson below."}
                </p>
              )}

              {canViewLessons && lessons.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {lessons.map((lesson) => (
                    <li key={lesson._id}>
                      <Link
                        to={`/courses/${slug}/lessons/${lesson._id}`}
                        className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <span className="font-medium text-gray-800">
                          <span className="text-gray-400 mr-2">
                            {lesson.order}.
                          </span>
                          {lesson.title}
                        </span>
                        <span className="text-sm text-blue-600">Open</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {canManage && (
                <form
                  onSubmit={handleCreateLesson}
                  className="border-t border-gray-100 pt-6"
                >
                  <h3 className="text-lg font-semibold mb-3">Add lesson</h3>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    name="title"
                    value={lessonForm.title}
                    onChange={handleLessonChange}
                    className="w-full border p-2 rounded mb-3"
                    required
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order (optional)
                  </label>
                  <input
                    name="order"
                    type="number"
                    min="1"
                    value={lessonForm.order}
                    onChange={handleLessonChange}
                    className="w-full border p-2 rounded mb-3"
                    placeholder="Auto if empty"
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL (optional)
                  </label>
                  <input
                    name="videoUrl"
                    type="url"
                    value={lessonForm.videoUrl}
                    onChange={handleLessonChange}
                    className="w-full border p-2 rounded mb-3"
                    placeholder="https://..."
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <RichTextEditor
                    value={lessonForm.content}
                    onChange={(content) =>
                      setLessonForm({ ...lessonForm, content })
                    }
                    placeholder="Lesson content..."
                    minHeightClass="min-h-[140px]"
                  />

                  <button
                    type="submit"
                    disabled={savingLesson}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                  >
                    {savingLesson ? "Adding..." : "Add Lesson"}
                  </button>
                </form>
              )}
            </section>
          )}

          {!loading && course && !editing && (
            <section className="mt-8 bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4">
                Reviews ({course.reviewCount || reviews.length})
              </h2>

              {canReview && (!myReview || editingReview) && (
                <form onSubmit={handleSubmitReview} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {myReview ? "Update your review" : "Leave a review"}
                  </label>
                  <div className="mb-3">
                    <StarRating
                      value={reviewRating}
                      onChange={setReviewRating}
                    />
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    rows={3}
                    className="w-full border p-2 rounded mb-3 resize-y"
                    placeholder="Share your experience (optional)..."
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={savingReview}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                    >
                      {savingReview
                        ? "Saving..."
                        : myReview
                          ? "Save Review"
                          : "Submit Review"}
                    </button>
                    {myReview && editingReview && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReview(false);
                          setReviewRating(myReview.rating);
                          setReviewContent(myReview.content || "");
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              {canReview && myReview && !editingReview && (
                <div className="mb-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingReview(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Edit my review
                  </button>
                </div>
              )}

              {isStudent && !enrolled && (
                <p className="text-gray-500 mb-4">
                  Enroll in this course to leave a rating and review.
                </p>
              )}

              {reviewsLoading && (
                <p className="text-gray-500">Loading reviews...</p>
              )}
              {reviewsError && (
                <p className="text-red-500 mb-4">{reviewsError}</p>
              )}
              {!reviewsLoading && reviews.length === 0 && !reviewsError && (
                <p className="text-gray-500">No reviews yet. Be the first.</p>
              )}

              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li
                    key={review._id}
                    className="border border-gray-100 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.authorName ||
                            review.author?.username ||
                            "User"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating
                            value={review.rating}
                            readOnly
                            size="sm"
                          />
                          <span className="text-xs text-gray-500">
                            {review.createdAt &&
                              new Date(review.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {canDeleteReview(review) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review)}
                          disabled={deletingReviewId === review._id}
                          className="text-sm text-red-600 hover:text-red-700 disabled:opacity-60"
                        >
                          {deletingReviewId === review._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}
                    </div>
                    {review.content ? (
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {review.content}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm italic">
                        No written review
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!loading && course && editing && (
            <form
              onSubmit={handleUpdate}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4">Edit Course</h2>

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
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={8}
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
                className="w-full border p-2 rounded mb-4"
                required
              />

              <ImageUploadField
                label="Course cover"
                value={form.image}
                onChange={(image) => setForm({ ...form, image })}
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
                      title: course.title,
                      description: course.description,
                      price: String(course.price),
                      image: course.image,
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
    </>
  );
}

export default CourseDetail;
