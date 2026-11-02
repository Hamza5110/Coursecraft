import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../context/AuthContext";
import { getTeachingCourses, mediaUrl } from "../api/blogApi";

function InstructorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [summary, setSummary] = useState({
    courseCount: 0,
    totalEnrollments: 0,
    totalLessons: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccess =
    user?.role === "instructor" || user?.role === "admin";

  useEffect(() => {
    if (!canAccess) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getTeachingCourses();
        setCourses(data.courses || []);
        setSummary(
          data.summary || {
            courseCount: 0,
            totalEnrollments: 0,
            totalLessons: 0,
          },
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canAccess]);

  if (!canAccess) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <>
      <Navbar />
      <section className="min-h-[70vh] bg-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                {user?.role === "admin"
                  ? "All courses on the platform"
                  : "Courses you teach"}
              </p>
            </div>
            <Link
              to="/courses/new"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center"
            >
              Create Course
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {summary.courseCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Total enrollments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {summary.totalEnrollments}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Total lessons</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {summary.totalLessons}
              </p>
            </div>
          </div>

          {loading && (
            <p className="text-center text-gray-500">Loading dashboard...</p>
          )}
          {error && <p className="text-center text-red-500 mb-4">{error}</p>}
          {!loading && !error && courses.length === 0 && (
            <p className="text-center text-gray-500">
              No courses yet.{" "}
              <Link to="/courses/new" className="text-blue-600 hover:underline">
                Create your first course
              </Link>
            </p>
          )}

          {!loading && courses.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
              <table className="w-full text-left min-w-[720px]">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                      Course
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                      Enrollments
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                      Lessons
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course._id}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={mediaUrl(course.image)}
                            alt={course.title}
                            className="h-12 w-16 object-cover rounded bg-gray-100"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://placehold.co/96x72?text=Course";
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {course.title}
                            </p>
                            {user?.role === "admin" && (
                              <p className="text-xs text-gray-500">
                                {course.instructor?.username ||
                                  course.instructor?.email ||
                                  "Unknown instructor"}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        ${course.price}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {course.enrollmentCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {course.lessonCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3 text-sm">
                          <Link
                            to={`/courses/${course.slug}`}
                            className="text-blue-600 hover:underline"
                          >
                            Open / Edit
                          </Link>
                          <Link
                            to={`/courses/${course.slug}`}
                            className="text-gray-600 hover:underline"
                          >
                            Manage lessons
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

export default InstructorDashboard;
