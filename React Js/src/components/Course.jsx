import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Pagination from "./Pagination";
import { useAuth } from "../context/AuthContext";
import { getAllCourses, getCourseInstructors, mediaUrl } from "../api/blogApi";

const PAGE_LIMIT = 10;

const emptyFilters = {
  search: "",
  minPrice: "",
  maxPrice: "",
  instructor: "",
};

function Course() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);

  const canCreate =
    user?.role === "instructor" || user?.role === "admin";

  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const data = await getCourseInstructors();
        setInstructors(data.instructors || []);
      } catch {
        setInstructors([]);
      }
    };
    loadInstructors();
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllCourses({
          ...filters,
          page,
          limit: PAGE_LIMIT,
        });
        setCourses(data.courses || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [filters, page]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleApply = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters({
      search: form.search.trim(),
      minPrice: form.minPrice,
      maxPrice: form.maxPrice,
      instructor: form.instructor,
    });
  };

  const handleClear = () => {
    setForm(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <>
      <Navbar />
      <section className="min-h-[70vh] bg-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold">Courses</h1>
            {canCreate && (
              <Link
                to="/courses/new"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-center"
              >
                Create Course
              </Link>
            )}
          </div>

          <form
            onSubmit={handleApply}
            className="bg-white p-4 rounded-xl shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <input
              name="search"
              type="text"
              value={form.search}
              onChange={handleChange}
              placeholder="Search by title..."
              className="border border-gray-200 rounded-lg px-3 py-2 lg:col-span-2"
            />
            <input
              name="minPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.minPrice}
              onChange={handleChange}
              placeholder="Min price"
              className="border border-gray-200 rounded-lg px-3 py-2"
            />
            <input
              name="maxPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.maxPrice}
              onChange={handleChange}
              placeholder="Max price"
              className="border border-gray-200 rounded-lg px-3 py-2"
            />
            <select
              name="instructor"
              value={form.instructor}
              onChange={handleChange}
              className="border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="">All instructors</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.username}
                </option>
              ))}
            </select>
            <div className="flex gap-2 md:col-span-2 lg:col-span-5">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Apply filters
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {loading && (
            <p className="text-center text-gray-500">Loading courses...</p>
          )}
          {error && <p className="text-center text-red-500 mb-4">{error}</p>}
          {!loading && !error && courses.length === 0 && (
            <p className="text-center text-gray-500">
              {hasActiveFilters ? (
                "No courses match your filters."
              ) : (
                <>
                  No courses yet.
                  {canCreate && (
                    <>
                      {" "}
                      <Link
                        to="/courses/new"
                        className="text-blue-600 hover:underline"
                      >
                        Create the first one
                      </Link>
                    </>
                  )}
                </>
              )}
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
                      e.currentTarget.src =
                        "https://placehold.co/600x240?text=Course";
                    }}
                  />
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">
                      {course.title}
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">
                      By {instructorName}
                    </p>
                    <p className="text-sm text-amber-600 mb-2">
                      {course.reviewCount > 0
                        ? `★ ${Number(course.averageRating || 0).toFixed(1)} (${course.reviewCount})`
                        : "No ratings yet"}
                    </p>
                    <p className="text-gray-600 mb-4 flex-1">{preview}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-600">
                        ${course.price}
                      </span>
                      <Link
                        to={`/courses/${course.slug}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      </section>
      <Footer />
    </>
  );
}

export default Course;
