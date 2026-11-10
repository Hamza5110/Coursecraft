import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "./Hero";
import Card from "./Card";
import Pagination from "./Pagination";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import { getAllBlogs } from "../api/blogApi";
import { useAuth } from "../context/AuthContext";

const PAGE_LIMIT = 10;

function Home() {
  const { isLoggedIn } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadBlogs = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllBlogs(
          { search, page, limit: PAGE_LIMIT },
          controller.signal,
        );
        setBlogs(data.blogs || []);
        setPagination(data.pagination || null);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBlogs();
    return () => controller.abort();
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
      {page === 1 && !search && <Hero />}
      <section id="latest-blogs" className="bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-3xl font-bold text-gray-900">
              Latest Blogs
            </h2>
            {isLoggedIn ? (
              <Button as={Link} to="/blogs/new">
                Create Blog
              </Button>
            ) : (
              <Button as={Link} to="/signup" variant="secondary">
                Join to write
              </Button>
            )}
          </div>

          <form
            onSubmit={handleSearch}
            className="mb-8 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row"
          >
            <label className="sr-only" htmlFor="blog-search">
              Search blogs
            </label>
            <input
              id="blog-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search blogs by title..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2"
            />
            <div className="flex gap-2">
              <Button type="submit">Search</Button>
              {(search || searchInput) && (
                <Button type="button" variant="secondary" onClick={handleClear}>
                  Clear
                </Button>
              )}
            </div>
          </form>

          {loading && (
            <p className="text-center text-gray-500" aria-live="polite">
              Loading blogs...
            </p>
          )}
          {error && (
            <Alert className="mb-4 text-center">{error}</Alert>
          )}
          {!loading && !error && blogs.length === 0 && (
            <p className="text-center text-gray-500">
              {search ? (
                <>No blogs match “{search}”.</>
              ) : (
                <>
                  No blogs yet.{" "}
                  {isLoggedIn ? (
                    <Link
                      to="/blogs/new"
                      className="text-blue-700 hover:underline"
                    >
                      Create the first one
                    </Link>
                  ) : (
                    <Link to="/signup" className="text-blue-700 hover:underline">
                      Sign up to publish
                    </Link>
                  )}
                </>
              )}
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <Card
                key={blog._id}
                id={blog._id}
                title={blog.title}
                excerpt={blog.excerpt}
                body={blog.content}
                authorName={blog.authorName || blog.author?.username}
                likesCount={blog.likesCount ?? 0}
                coverImage={blog.coverImage}
              />
            ))}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </section>
    </>
  );
}

export default Home;
