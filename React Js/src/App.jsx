import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const Home = lazy(() => import("./components/Home"));
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const CreateBlog = lazy(() => import("./components/CreateBlog"));
const BlogDetail = lazy(() => import("./components/BlogDetail"));
const LikedBlogs = lazy(() => import("./components/LikedBlogs"));
const Course = lazy(() => import("./components/Course"));
const MyCourses = lazy(() => import("./components/MyCourses"));
const CreateCourse = lazy(() => import("./components/CreateCourse"));
const CourseDetail = lazy(() => import("./components/CourseDetail"));
const LessonDetail = lazy(() => import("./components/LessonDetail"));
const InstructorDashboard = lazy(
  () => import("./components/InstructorDashboard"),
);
const Profile = lazy(() => import("./components/Profile"));
const AdminUsers = lazy(() => import("./components/AdminUsers"));
const NotFound = lazy(() => import("./components/NotFound"));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
      Loading…
    </div>
  );
}

function GuestOnly({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (isLoggedIn) {
    const redirectTo = location.state?.from?.pathname || "/";
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/courses" element={<Course />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />

          <Route
            path="/blogs/new"
            element={
              <ProtectedRoute>
                <CreateBlog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs/liked"
            element={
              <ProtectedRoute>
                <LikedBlogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute roles={["student"]}>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor"
            element={
              <ProtectedRoute roles={["instructor", "admin"]}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/new"
            element={
              <ProtectedRoute roles={["instructor", "admin"]}>
                <CreateCourse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:slug/lessons/:lessonId"
            element={
              <ProtectedRoute>
                <LessonDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="/login"
          element={
            <GuestOnly>
              <Login />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <Signup />
            </GuestOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestOnly>
              <ForgotPassword />
            </GuestOnly>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestOnly>
              <ResetPassword />
            </GuestOnly>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
