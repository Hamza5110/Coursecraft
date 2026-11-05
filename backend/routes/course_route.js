import express from "express";
import {
  protect,
  authorize,
  optionalAuth,
} from "../middleware/auth_middleware.js";
import {
  createCourse,
  getCourses,
  getCourseInstructors,
  getCourseBySlug,
  getMyCourses,
  getTeachingCourses,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  unenrollFromCourse,
} from "../controller/course_controller.js";
import {
  getLessonsByCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} from "../controller/lesson_controller.js";
import {
  getReviewsByCourse,
  createReview,
  updateReview,
  deleteReview,
} from "../controller/review_controller.js";

const router = express.Router();

router.post("/", protect, authorize("instructor", "admin"), createCourse);
router.get("/", getCourses);
router.get("/instructors", getCourseInstructors);
router.get("/my", protect, authorize("student"), getMyCourses);
router.get(
  "/teaching",
  protect,
  authorize("instructor", "admin"),
  getTeachingCourses,
);

router.get("/:slug/lessons", protect, getLessonsByCourse);
router.get("/:slug/lessons/:lessonId", protect, getLessonById);
router.post(
  "/:slug/lessons",
  protect,
  authorize("instructor", "admin"),
  createLesson,
);
router.put(
  "/:slug/lessons/:lessonId",
  protect,
  authorize("instructor", "admin"),
  updateLesson,
);
router.delete(
  "/:slug/lessons/:lessonId",
  protect,
  authorize("instructor", "admin"),
  deleteLesson,
);

router.get("/:slug/reviews", getReviewsByCourse);
router.post(
  "/:slug/reviews",
  protect,
  authorize("student"),
  createReview,
);
router.put("/:slug/reviews/:reviewId", protect, updateReview);
router.delete("/:slug/reviews/:reviewId", protect, deleteReview);

router.get("/:slug", optionalAuth, getCourseBySlug);
router.put("/:slug", protect, authorize("instructor", "admin"), updateCourse);
router.delete("/:slug", protect, authorize("admin"), deleteCourse);
router.post("/:slug/enroll", protect, authorize("student"), enrollInCourse);
router.post(
  "/:slug/unenroll",
  protect,
  authorize("student"),
  unenrollFromCourse,
);

export default router;
