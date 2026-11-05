import Course from "../models/Course.js";
import Review from "../models/Review.js";

const findCourseBySlug = (slug) => Course.findOne({ slug });

async function syncCourseRating(courseId) {
  const stats = await Review.aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: "$course",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats[0]
    ? Math.round(stats[0].averageRating * 10) / 10
    : 0;
  const reviewCount = stats[0]?.reviewCount || 0;

  await Course.findByIdAndUpdate(courseId, { averageRating, reviewCount });
  return { averageRating, reviewCount };
}

export const getReviewsByCourse = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug)
      .select("averageRating reviewCount")
      .lean();
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const reviews = await Review.find({ course: course._id })
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.status(200).json({
      success: true,
      reviews,
      averageRating: course.averageRating || 0,
      reviewCount: course.reviewCount || 0,
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reviews" });
  }
};

export const createReview = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug).select(
      "students",
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const enrolled = course.students.some((id) => id.equals(req.user._id));
    if (!enrolled) {
      return res.status(403).json({
        success: false,
        message: "Enroll in this course to leave a review",
      });
    }

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer from 1 to 5",
      });
    }

    const content =
      typeof req.body.content === "string"
        ? req.body.content.trim().slice(0, 2000)
        : "";

    const existing = await Review.exists({
      course: course._id,
      author: req.user._id,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "You already reviewed this course. Update your review instead.",
      });
    }

    const review = await Review.create({
      course: course._id,
      author: req.user._id,
      authorName: req.user.username,
      rating,
      content,
    });

    const stats = await syncCourseRating(course._id);
    await review.populate("author", "username");

    res.status(201).json({
      success: true,
      message: "Review added",
      review,
      ...stats,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this course",
      });
    }
    res.status(500).json({ success: false, message: "Failed to create review" });
  }
};

export const updateReview = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug).select("_id");
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const review = await Review.findById(req.params.reviewId);
    if (!review || String(review.course) !== String(course._id)) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    if (String(review.author) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own review",
      });
    }

    if (req.body.rating !== undefined) {
      const rating = Number(req.body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be an integer from 1 to 5",
        });
      }
      review.rating = rating;
    }

    if (req.body.content !== undefined) {
      review.content =
        typeof req.body.content === "string"
          ? req.body.content.trim().slice(0, 2000)
          : "";
    }

    await review.save();
    const stats = await syncCourseRating(course._id);
    await review.populate("author", "username");

    res.status(200).json({
      success: true,
      message: "Review updated",
      review,
      ...stats,
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update review" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const course = await findCourseBySlug(req.params.slug).select("_id");
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const review = await Review.findById(req.params.reviewId);
    if (!review || String(review.course) !== String(course._id)) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    const isOwner = String(review.author) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    await review.deleteOne();
    const stats = await syncCourseRating(course._id);

    res.status(200).json({
      success: true,
      message: "Review deleted",
      ...stats,
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete review" });
  }
};
