import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import { sanitizeContent } from "../utils/sanitize.js";
import { assertSafeMediaUrl } from "../utils/urls.js";

const findCourseBySlug = (slug) => Course.findOne({ slug });

const isSameId = (a, b) => String(a) === String(b);

const canManageCourse = (course, user) => {
  if (user.role === "admin") return true;
  if (user.role === "instructor" && isSameId(course.instructor, user._id)) {
    return true;
  }
  return false;
};

const canAccessLessons = (course, user) => {
  if (canManageCourse(course, user)) return true;
  return course.students.some((id) => isSameId(id, user._id));
};

export const getLessonsByCourse = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug)
      .select("instructor students")
      .lean();
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (!canAccessLessons(course, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Enroll in this course to view lessons",
      });
    }

    const lessons = await Lesson.find({ course: course._id })
      .sort({ order: 1, createdAt: 1 })
      .select("title order videoUrl createdAt updatedAt")
      .lean();

    res.status(200).json({
      success: true,
      lessons,
      canManage: canManageCourse(course, req.user),
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch lessons" });
  }
};

export const getLessonById = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug)
      .select("title instructor students")
      .lean();
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (!canAccessLessons(course, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Enroll in this course to view lessons",
      });
    }

    const lesson = await Lesson.findOne({
      _id: req.params.lessonId,
      course: course._id,
    }).lean();

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    res.status(200).json({
      success: true,
      lesson,
      courseTitle: course.title,
      courseSlug: req.params.slug,
      canManage: canManageCourse(course, req.user),
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch lesson" });
  }
};

export const createLesson = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug).select(
      "instructor students",
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only the course instructor or admin can add lessons",
      });
    }

    const { title, content, videoUrl, order } = req.body;
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const safeContent = sanitizeContent(content);
    if (!safeContent.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const safeVideoUrl = videoUrl ? String(videoUrl).trim() : "";
    if (safeVideoUrl) assertSafeMediaUrl(safeVideoUrl, "Video URL");

    let lessonOrder = Number(order);
    if (!Number.isFinite(lessonOrder) || lessonOrder < 1) {
      const last = await Lesson.findOne({ course: course._id })
        .sort({ order: -1 })
        .select("order")
        .lean();
      lessonOrder = last ? last.order + 1 : 1;
    }

    const lesson = await Lesson.create({
      course: course._id,
      title: String(title).trim(),
      content: safeContent,
      videoUrl: safeVideoUrl,
      order: lessonOrder,
    });

    res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      lesson,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? "Failed to create lesson" : error.message,
    });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug).select(
      "instructor students",
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only the course instructor or admin can update lessons",
      });
    }

    const lesson = await Lesson.findOne({
      _id: req.params.lessonId,
      course: course._id,
    });
    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    const { title, content, videoUrl, order } = req.body;
    if (title !== undefined) lesson.title = String(title).trim();
    if (content !== undefined) {
      const safeContent = sanitizeContent(content);
      if (!safeContent.trim()) {
        return res.status(400).json({
          success: false,
          message: "Content is required",
        });
      }
      lesson.content = safeContent;
    }
    if (videoUrl !== undefined) {
      const safeVideoUrl = String(videoUrl).trim();
      if (safeVideoUrl) assertSafeMediaUrl(safeVideoUrl, "Video URL");
      lesson.videoUrl = safeVideoUrl;
    }
    if (order !== undefined) {
      const nextOrder = Number(order);
      if (!Number.isFinite(nextOrder) || nextOrder < 1) {
        return res.status(400).json({
          success: false,
          message: "Order must be a positive number",
        });
      }
      lesson.order = nextOrder;
    }

    await lesson.save();
    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      lesson,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? "Failed to update lesson" : error.message,
    });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug).select(
      "instructor students",
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only the course instructor or admin can delete lessons",
      });
    }

    const lesson = await Lesson.findOneAndDelete({
      _id: req.params.lessonId,
      course: course._id,
    });
    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete lesson" });
  }
};
