import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

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
}

/**
 * Remove a user and related content so admin delete leaves no orphans.
 * Instructor-owned courses (and their lessons/reviews) are deleted.
 */
export async function deleteUserAndRelatedData(userId) {
  const blogs = await Blog.find({ author: userId }).select("_id").lean();
  const blogIds = blogs.map((b) => b._id);

  const taughtCourses = await Course.find({ instructor: userId })
    .select("_id")
    .lean();
  const taughtCourseIds = taughtCourses.map((c) => c._id);

  const authoredReviews = await Review.find({ author: userId })
    .select("course")
    .lean();
  const reviewCourseIds = [
    ...new Set(authoredReviews.map((r) => String(r.course))),
  ];

  await Promise.all([
    blogIds.length
      ? Comment.deleteMany({ blog: { $in: blogIds } })
      : Promise.resolve(),
    Comment.deleteMany({ author: userId }),
    Blog.deleteMany({ author: userId }),
    Blog.updateMany(
      { likedBy: userId },
      { $pull: { likedBy: userId }, $inc: { likesCount: -1 } },
    ),
    Course.updateMany({ students: userId }, { $pull: { students: userId } }),
    Review.deleteMany({ author: userId }),
    taughtCourseIds.length
      ? Lesson.deleteMany({ course: { $in: taughtCourseIds } })
      : Promise.resolve(),
    taughtCourseIds.length
      ? Review.deleteMany({ course: { $in: taughtCourseIds } })
      : Promise.resolve(),
    Course.deleteMany({ instructor: userId }),
  ]);

  await Promise.all(
    reviewCourseIds
      .filter((id) => !taughtCourseIds.some((c) => String(c) === id))
      .map((id) => syncCourseRating(id)),
  );

  await User.findByIdAndDelete(userId);
}
