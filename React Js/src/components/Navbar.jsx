import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `font-medium transition ${
    isActive ? "text-blue-600" : "text-gray-700 hover:text-blue-500"
  }`;

function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const canCreateCourse = user?.role === "instructor" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";
  const initials = (user?.username || user?.email || "U")
    .slice(0, 1)
    .toUpperCase();

  useEffect(() => {
    const onClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const closeMenus = () => {
    setMenuOpen(false);
    setProfileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          to="/"
          onClick={closeMenus}
          className="flex items-center shrink-0"
        >
          <img src={logo} alt="Blog Verse" className="w-70 h-40" />
        </Link>

        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/courses" className={linkClass}>
              Courses
            </NavLink>
            {isStudent && (
              <NavLink to="/my-courses" className={linkClass}>
                My Courses
              </NavLink>
            )}
            <NavLink to="/blogs/new" className={linkClass}>
              Create Blog
            </NavLink>
            <NavLink to="/blogs/liked" className={linkClass}>
              Liked
            </NavLink>
            {canCreateCourse && (
              <>
                <NavLink to="/instructor" className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/courses/new" className={linkClass}>
                  Create Course
                </NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink to="/admin/users" className={linkClass}>
                Admin
              </NavLink>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {!isLoggedIn && (
            <Link
              to="/login"
              className="bg-blue-500 text-white rounded-md hover:bg-blue-600 px-3 py-1.5 text-sm font-medium transition"
            >
              Login
            </Link>
          )}

          {isLoggedIn && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-gray-200 pl-1 pr-3 py-1 hover:bg-gray-50 transition"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                  {initials}
                </span>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user?.username || "Account"}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                    <span className="mt-2 inline-block text-xs capitalize bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      {user?.role || "student"}
                    </span>
                  </div>
                  <Link
                    to="/profile"
                    onClick={closeMenus}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Profile
                  </Link>
                  {isStudent && (
                    <Link
                      to="/my-courses"
                      onClick={closeMenus}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Courses
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin/users"
                      onClick={closeMenus}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Admin · Users
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoggedIn && (
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 text-gray-700"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>
      </div>

      {isLoggedIn && menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          <NavLink to="/" end className={linkClass} onClick={closeMenus}>
            Home
          </NavLink>
          <NavLink to="/courses" className={linkClass} onClick={closeMenus}>
            Courses
          </NavLink>
          {isStudent && (
            <NavLink
              to="/my-courses"
              className={linkClass}
              onClick={closeMenus}
            >
              My Courses
            </NavLink>
          )}
          <NavLink to="/blogs/new" className={linkClass} onClick={closeMenus}>
            Create Blog
          </NavLink>
          <NavLink to="/blogs/liked" className={linkClass} onClick={closeMenus}>
            Liked
          </NavLink>
          {canCreateCourse && (
            <>
              <NavLink
                to="/instructor"
                className={linkClass}
                onClick={closeMenus}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/courses/new"
                className={linkClass}
                onClick={closeMenus}
              >
                Create Course
              </NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={linkClass}
              onClick={closeMenus}
            >
              Admin
            </NavLink>
          )}
          <NavLink to="/profile" className={linkClass} onClick={closeMenus}>
            Profile
          </NavLink>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
