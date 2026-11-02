import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Card from "./Card";
import Pagination from "./Pagination";
import { getLikedBlogs } from "../api/blogApi";

const PAGE_LIMIT = 10;

function LikedBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getLikedBlogs({ page, limit: PAGE_LIMIT });
        setBlogs(data.blogs || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  return (
    <>
      <Navbar />
      <section className="min-h-[70vh] bg-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold">Liked Blogs</h1>
            <Link to="/" className="text-blue-600 hover:underline text-sm">
              Back to Home
            </Link>
          </div>

          {loading && (
            <p className="text-center text-gray-500">Loading liked blogs...</p>
          )}
          {error && <p className="text-center text-red-500 mb-4">{error}</p>}
          {!loading && !error && blogs.length === 0 && (
            <p className="text-center text-gray-500">
              You haven&apos;t liked any blogs yet.{" "}
              <Link to="/" className="text-blue-600 hover:underline">
                Browse blogs
              </Link>
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

export default LikedBlogs;
