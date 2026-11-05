import { Link } from "react-router-dom";
import Button from "./ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_45%)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          Blog Verse
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Stories and courses that move you forward
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Read practical blogs and enroll in free learning paths across
          technology, programming, and more.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button as={Link} to="/#latest-blogs">
            Explore Blogs
          </Button>
          <Button as={Link} to="/courses" variant="secondary">
            Browse Courses
          </Button>
        </div>
      </div>
    </section>
  );
}
