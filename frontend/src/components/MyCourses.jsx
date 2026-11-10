import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyCourses, mediaUrl, unenrollFromCourse } from "../api/blogApi";

function MyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyCourses();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "student") {
      loadCourses();
    }
  }, [user?.role]);

  if (user?.role !== "student") {
    return <Navigate to="/courses" replace />;
  }

  const handleUnenroll = async (slug, title) => {
    const confirmed = window.confirm(
      `Unenroll from "${title}"? You can enroll again later.`,
    );
    if (!confirmed) return;

    setSavingSlug(slug);
    setError("");
    setMessage("");
    try {
      const data = await unenrollFromCourse(slug);
      setCourses((prev) => prev.filter((course) => course.slug !== slug));
      setMessage(data.message || "Unenrolled successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <>
      <section className="min-h-[70vh] bg-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">My Courses</h1>
            <Link
              to="/courses"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Browse all courses
            </Link>
          </div>

          {loading && (
            <p className="text-center text-gray-500">Loading your courses...</p>
          )}
          {error && <p className="text-center text-red-500 mb-4">{error}</p>}
          {message && (
            <p className="text-center text-green-600 mb-4">{message}</p>
          )}
          {!loading && !error && courses.length === 0 && (
            <p className="text-center text-gray-500">
              You&apos;re not enrolled in any courses yet.{" "}
              <Link to="/courses" className="text-blue-600 hover:underline">
                Browse courses
              </Link>
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const instructorName =
                course.instructor?.username ||
                course.instructor?.email ||
                "Unknown";
              const preview =
                course.description?.length > 100
                  ? `${course.description.slice(0, 100)}...`
                  : course.description;

              return (
                <div
                  key={course._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 border border-gray-200 overflow-hidden flex flex-col"
                >
                  <img
                    src={mediaUrl(course.image)}
                    alt={course.title}
                    className="w-full h-40 object-cover bg-gray-200"
                    onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = "none";
                  }}
                  />
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">
                      {course.title}
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">
                      By {instructorName}
                    </p>
                    <p className="text-gray-600 mb-4 flex-1">{preview}</p>
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/courses/${course.slug}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                      >
                        View Details
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          handleUnenroll(course.slug, course.title)
                        }
                        disabled={savingSlug === course.slug}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-60"
                      >
                        {savingSlug === course.slug
                          ? "Unenrolling..."
                          : "Unenroll"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

export default MyCourses;
