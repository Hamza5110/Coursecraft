import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-gray-900">
            Blog Verse
          </p>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Blog Verse. All rights reserved.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-blue-700">
            Blogs
          </Link>
          <Link to="/courses" className="text-gray-600 hover:text-blue-700">
            Courses
          </Link>
          <Link to="/signup" className="text-gray-600 hover:text-blue-700">
            Sign up
          </Link>
          <Link to="/login" className="text-gray-600 hover:text-blue-700">
            Log in
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
