import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/components");
const files = [
  "Home.jsx",
  "Course.jsx",
  "CourseDetail.jsx",
  "LessonDetail.jsx",
  "CreateBlog.jsx",
  "BlogDetail.jsx",
  "InstructorDashboard.jsx",
  "LikedBlogs.jsx",
  "MyCourses.jsx",
  "CreateCourse.jsx",
  "AdminUsers.jsx",
  "Profile.jsx",
];

for (const f of files) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(/import Navbar from "\.\/Navbar";\r?\n/g, "");
  s = s.replace(/import Footer from "\.\/Footer";\r?\n/g, "");
  s = s.replace(/\s*<Navbar \/>\r?\n/g, "\n");
  s = s.replace(/\s*<Footer \/>\r?\n/g, "\n");
  fs.writeFileSync(p, s);
  console.log("updated", f);
}
