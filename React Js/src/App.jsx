import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Course from "./components/Course";
import MyCourses from "./components/MyCourses";
import CreateCourse from "./components/CreateCourse";
import CourseDetail from "./components/CourseDetail";
import LessonDetail from "./components/LessonDetail";
import InstructorDashboard from "./components/InstructorDashboard";
import Signup from "./components/Signup";
import CreateBlog from "./components/CreateBlog";
import BlogDetail from "./components/BlogDetail";
import LikedBlogs from "./components/LikedBlogs";
import Profile from "./components/Profile";
import AdminUsers from "./components/AdminUsers";
import { useAuth } from "./context/AuthContext";

function App() {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      {isLoggedIn ? (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/blogs/new" element={<CreateBlog />} />
          <Route path="/blogs/liked" element={<LikedBlogs />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/courses" element={<Course />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/courses/new" element={<CreateCourse />} />
          <Route
            path="/courses/:slug/lessons/:lessonId"
            element={<LessonDetail />}
          />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

export default App;
