import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/components");
const files = [
  "Course.jsx",
  "MyCourses.jsx",
  "InstructorDashboard.jsx",
  "ImageUploadField.jsx",
];

const replacement = `onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = "none";
                  }}`;

for (const f of files) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(
    /onError=\{\(e\) => \{\s*e\.currentTarget\.src\s*=\s*"https:\/\/placehold\.co[^"]*";\s*\}\}/g,
    replacement,
  );
  fs.writeFileSync(p, s);
  console.log("fixed", f);
}
