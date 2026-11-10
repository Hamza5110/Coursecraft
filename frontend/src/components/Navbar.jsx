import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo-nav.svg";
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

  const handleLogout = async () => {
    setProfileOpen(false);
    setMenuOpen(false);
    await logout();
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
          className="flex h-full shrink-0 items-center gap-2.5 py-2"
        >
          <img
            src={logo}
            alt=""
            className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
            width={36}
            height={36}
          />
          <span className="font-display text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            Coursecraft
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>
            Blogs
          </NavLink>
          <NavLink to="/courses" className={linkClass}>
            Courses
          </NavLink>
          {isLoggedIn && isStudent && (
            <NavLink to="/my-courses" className={linkClass}>
              My Courses
            </NavLink>
          )}
          {isLoggedIn && (
            <NavLink to="/blogs/liked" className={linkClass}>
              Liked posts
            </NavLink>
          )}
          {isLoggedIn && canCreateCourse && (
            <>
              <NavLink to="/instructor" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/courses/new" className={linkClass}>
                Create Course
              </NavLink>
              <NavLink to="/blogs/new" className={linkClass}>
                Create Blog
              </NavLink>
            </>
          )}
          {isLoggedIn && !canCreateCourse && (
            <NavLink to="/blogs/new" className={linkClass}>
              Create Blog
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/users" className={linkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isLoggedIn && (
            <>
              <Link
                to="/signup"
                className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition"
              >
                Sign up
              </Link>
              <Link
                to="/login"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Log in
              </Link>
            </>
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

          <button
            type="button"
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-700"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 lg:hidden"
        >
          <NavLink to="/" end className={linkClass} onClick={closeMenus}>
            Blogs
          </NavLink>
          <NavLink to="/courses" className={linkClass} onClick={closeMenus}>
            Courses
          </NavLink>
          {isLoggedIn && isStudent && (
            <NavLink
              to="/my-courses"
              className={linkClass}
              onClick={closeMenus}
            >
              My Courses
            </NavLink>
          )}
          {isLoggedIn && (
            <>
              <NavLink
                to="/blogs/new"
                className={linkClass}
                onClick={closeMenus}
              >
                Create Blog
              </NavLink>
              <NavLink
                to="/blogs/liked"
                className={linkClass}
                onClick={closeMenus}
              >
                Liked posts
              </NavLink>
            </>
          )}
          {isLoggedIn && canCreateCourse && (
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
          {isLoggedIn ? (
            <>
              <NavLink
                to="/profile"
                className={linkClass}
                onClick={closeMenus}
              >
                Profile
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="text-left font-medium text-red-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={closeMenus}>
                Log in
              </NavLink>
              <NavLink to="/signup" className={linkClass} onClick={closeMenus}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
