import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import Review from "../models/Review.js";
import { makeUniqueSlug, slugify } from "../utils/slugify.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";

const findCourseBySlug = (slug) => Course.findOne({ slug });

export const createCourse = async (req, res) => {
  try {
    const { title, description, price, image } = req.body;
    if (!title || !description || !price || !image) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const slug = await makeUniqueSlug(Course, slugify(title));
    const course = new Course({
      title,
      slug,
      description,
      price,
      image,
      instructor: req.user._id,
    });
    await course.save();
    res
      .status(201)
      .json({ success: true, message: "Course created successfully", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
        .populate("instructor", "username email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      courses,
      pagination: buildPagination({ page, limit, total }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseInstructors = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "username email")
      .select("instructor");

    const byId = new Map();
    for (const course of courses) {
      const instructor = course.instructor;
      if (instructor?._id) {
        byId.set(String(instructor._id), {
          id: instructor._id,
          username: instructor.username,
          email: instructor.email,
        });
      }
    }

    res.status(200).json({
      success: true,
      instructors: Array.from(byId.values()).sort((a, b) =>
        String(a.username).localeCompare(String(b.username)),
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseBySlug = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug).populate(
      "instructor",
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.status(200).json({ success: true, course: course.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id }).populate(
      "instructor",
      "username email",
    );
    res.status(200).json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeachingCourses = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { instructor: req.user._id };

    const courses = await Course.find(filter)
      .populate("instructor", "username email")
      .sort({ createdAt: -1 })
      .lean();

    const withStats = await Promise.all(
      courses.map(async (course) => {
        const lessonCount = await Lesson.countDocuments({ course: course._id });
        return {
          ...course,
          enrollmentCount: course.students?.length || 0,
          lessonCount,
        };
      }),
    );

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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      course.title = title;
      course.slug = await makeUniqueSlug(
        Course,
        slugify(title),
        course._id,
      );
    }
    if (description !== undefined) course.description = description;
    if (price !== undefined) course.price = price;
    if (image !== undefined) course.image = image;

    await course.save();
    res.status(200).json({ success: true, course: course.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const enrollInCourse = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    const alreadyEnrolled = course.students.some((id) =>
      id.equals(req.user._id),
    );
    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }
    course.students.push(req.user._id);
    await course.save();
    res.status(200).json({
      success: true,
      message: "Enrolled in course successfully",
      course: course.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unenrollFromCourse = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    const isEnrolled = course.students.some((id) => id.equals(req.user._id));
    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }
    course.students.pull(req.user._id);
    await course.save();
    res.status(200).json({
      success: true,
      message: "Unenrolled from course successfully",
      course: course.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
