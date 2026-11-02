import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Hero from "./Hero";
import Card from "./Card";
import Pagination from "./Pagination";
import { getAllBlogs } from "../api/blogApi";

const PAGE_LIMIT = 10;

function Home() {
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllBlogs({ search, page, limit: PAGE_LIMIT });
        setBlogs(data.blogs || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBlogs();
  }, [search, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <>
      <Navbar />
      <Hero />
      <section className="py-8 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-3xl font-bold">Latest Blogs</h2>
            <Link
              to="/blogs/new"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-center"
            >
              Create Blog
            </Link>
          </div>

          <form
            onSubmit={handleSearch}
            className="bg-white p-4 rounded-xl shadow-sm mb-8 flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search blogs by title..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Search
              </button>
              {(search || searchInput) && (
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
            <p className="text-center text-gray-500">Loading blogs...</p>
          )}
          {error && (
            <p className="text-center text-red-500 mb-4">{error}</p>
          )}
          {!loading && !error && blogs.length === 0 && (
            <p className="text-center text-gray-500">
              {search ? (
                <>No blogs match “{search}”.</>
              ) : (
                <>
                  No blogs yet.{" "}
                  <Link
                    to="/blogs/new"
                    className="text-blue-600 hover:underline"
                  >
                    Create the first one
                  </Link>
                </>
              )}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Card
                key={blog._id}
                id={blog._id}
                title={blog.title}
                body={blog.content}
                authorName={blog.authorName || blog.author?.username}
                likesCount={blog.likedBy?.length || 0}
                coverImage={blog.coverImage}
              />
            ))}
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

export default Home;
