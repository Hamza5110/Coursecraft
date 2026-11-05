import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { makeUniqueSlug, slugify } from "../utils/slugify.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";
import { assertSafeMediaUrl } from "../utils/urls.js";

const findCourseBySlug = (slug) => Course.findOne({ slug });

const PUBLIC_INSTRUCTOR = "username";

function shapeCourseForClient(course, userId) {
  const obj = course.toObject ? course.toObject() : { ...course };
  const students = obj.students || [];
  const enrolled = userId
    ? students.some((id) => String(id) === String(userId))
    : false;

  return {
    ...obj,
    students: undefined,
    studentCount: students.length,
    enrolled,
  };
}

export const createCourse = async (req, res) => {
  try {
    const { title, description, price, image } = req.body;
    if (!title || !description || image === undefined || image === null) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a number greater than or equal to 0",
      });
    }

    assertSafeMediaUrl(image, "Course image");

    const slug = await makeUniqueSlug(Course, slugify(title));
    const course = new Course({
      title: String(title).trim().slice(0, 200),
      slug,
      description: String(description).trim().slice(0, 5000),
      price: numericPrice,
      image: String(image).trim(),
      instructor: req.user._id,
    });
    await course.save();
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: shapeCourseForClient(course, req.user._id),
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? "Failed to create course" : error.message,
    });
  }
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getCourses = async (req, res) => {
  try {
    const { search, minPrice, maxPrice, instructor } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};

    if (search && String(search).trim()) {
      filter.title = {
        $regex: escapeRegex(String(search).trim()),
        $options: "i",
      };
    }

    const hasMin = minPrice !== undefined && minPrice !== "";
    const hasMax = maxPrice !== undefined && maxPrice !== "";
    if (hasMin || hasMax) {
      filter.price = {};
      if (hasMin) {
        const min = Number(minPrice);
        if (!Number.isFinite(min)) {
          return res.status(400).json({
            success: false,
            message: "minPrice must be a number",
          });
        }
        filter.price.$gte = min;
      }
      if (hasMax) {
        const max = Number(maxPrice);
        if (!Number.isFinite(max)) {
          return res.status(400).json({
            success: false,
            message: "maxPrice must be a number",
          });
        }
        filter.price.$lte = max;
      }
    }

    if (instructor && String(instructor).trim()) {
      filter.instructor = String(instructor).trim();
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .select("-students")
        .populate("instructor", PUBLIC_INSTRUCTOR)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter),
    ]);

    // studentCount via $size would need aggregation; approximate with enrollment
    // by a separate light query is heavier — store studentCount later. For now
    // re-fetch counts only if needed; list cards don't need exact enrollment.
    res.status(200).json({
      success: true,
      courses: courses.map((c) => ({
        ...c,
        studentCount: undefined,
        enrolled: false,
      })),
      pagination: buildPagination({ page, limit, total }),
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch courses" });
  }
};

export const getCourseInstructors = async (req, res) => {
  try {
    const instructorIds = await Course.distinct("instructor");
    const instructors = await User.find({ _id: { $in: instructorIds } })
      .select("username")
      .sort({ username: 1 })
      .lean();

    res.status(200).json({
      success: true,
      instructors: instructors.map((u) => ({
        id: u._id,
        username: u.username,
      })),
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch instructors" });
  }
};

export const getCourseBySlug = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug)
      .populate("instructor", PUBLIC_INSTRUCTOR)
      .lean();
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const userId = req.user?._id;
    const students = course.students || [];
    res.status(200).json({
      success: true,
      course: {
        ...course,
        students: undefined,
        studentCount: students.length,
        enrolled: userId
          ? students.some((id) => String(id) === String(userId))
          : false,
      },
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch course" });
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id })
      .select("-students")
      .populate("instructor", PUBLIC_INSTRUCTOR)
      .lean();
    res.status(200).json({
      success: true,
      courses: courses.map((c) => ({ ...c, enrolled: true })),
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch enrolled courses" });
  }
};

export const getTeachingCourses = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" ? {} : { instructor: req.user._id };

    const courses = await Course.find(filter)
      .populate("instructor", PUBLIC_INSTRUCTOR)
      .sort({ createdAt: -1 })
      .lean();

    const ids = courses.map((c) => c._id);
    const lessonCounts = await Lesson.aggregate([
      { $match: { course: { $in: ids } } },
      { $group: { _id: "$course", n: { $sum: 1 } } },
    ]);
    const lessonMap = new Map(
      lessonCounts.map((row) => [String(row._id), row.n]),
    );

    const withStats = courses.map((course) => {
      const enrollmentCount = course.students?.length || 0;
      const { students, ...rest } = course;
      return {
        ...rest,
        enrollmentCount,
        lessonCount: lessonMap.get(String(course._id)) || 0,
      };
    });

    const totalEnrollments = withStats.reduce(
      (sum, course) => sum + course.enrollmentCount,
      0,
    );
    const totalLessons = withStats.reduce(
      (sum, course) => sum + course.lessonCount,
      0,
    );

    res.status(200).json({
      success: true,
      courses: withStats,
      summary: {
        courseCount: withStats.length,
        totalEnrollments,
        totalLessons,
      },
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch teaching courses" });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const isOwner = String(course.instructor) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only the course instructor or admin can update this course",
      });
    }

    const { title, description, price, image } = req.body;
    if (title !== undefined) {
      course.title = String(title).trim().slice(0, 200);
      course.slug = await makeUniqueSlug(Course, slugify(title), course._id);
    }
    if (description !== undefined) {
      course.description = String(description).trim().slice(0, 5000);
    }
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a number greater than or equal to 0",
        });
      }
      course.price = numericPrice;
    }
    if (image !== undefined) {
      assertSafeMediaUrl(image, "Course image");
      course.image = String(image).trim();
    }

    await course.save();
    res.status(200).json({
      success: true,
      course: shapeCourseForClient(course, req.user._id),
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? "Failed to update course" : error.message,
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ slug: req.params.slug });
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    await Promise.all([
      Lesson.deleteMany({ course: course._id }),
      Review.deleteMany({ course: course._id }),
    ]);
    res
      .status(200)
      .json({ success: true, message: "Course deleted successfully" });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete course" });
  }
};

export const enrollInCourse = async (req, res) => {
  try {
    // Learning platform: enrollment is free. Price is display-only until payments ship.
    const course = await Course.findOneAndUpdate(
      {
        slug: req.params.slug,
        students: { $ne: req.user._id },
      },
      { $addToSet: { students: req.user._id } },
      { returnDocument: "after" },
    ).populate("instructor", PUBLIC_INSTRUCTOR);

    if (!course) {
      const exists = await findCourseBySlug(req.params.slug).select("_id students");
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    res.status(200).json({
      success: true,
      message: "Enrolled in course successfully",
      course: shapeCourseForClient(course, req.user._id),
    });
  } catch {
    res.status(500).json({ success: false, message: "Enrollment failed" });
  }
};

export const unenrollFromCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      {
        slug: req.params.slug,
        students: req.user._id,
      },
      { $pull: { students: req.user._id } },
      { returnDocument: "after" },
    ).populate("instructor", PUBLIC_INSTRUCTOR);

    if (!course) {
      const exists = await findCourseBySlug(req.params.slug).select("_id");
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
      return res.status(400).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    res.status(200).json({
      success: true,
      message: "Unenrolled from course successfully",
      course: shapeCourseForClient(course, req.user._id),
    });
  } catch {
    res.status(500).json({ success: false, message: "Unenroll failed" });
  }
};

export default {
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
};
