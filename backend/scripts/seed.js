import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import Review from "../models/Review.js";
import { BCRYPT_ROUNDS } from "../utils/password.js";
import { buildExcerpt } from "../utils/excerpt.js";
import { slugify, makeUniqueSlug } from "../utils/slugify.js";

dotenv.config();

const SEED_PASSWORD = "Password1";

const userSeeds = [
  {
    username: "Admin",
    email: "admin@blogverse.com",
    role: "admin",
  },
  {
    username: "Sara Khan",
    email: "sara@blogverse.com",
    role: "instructor",
  },
  {
    username: "Omar Ali",
    email: "omar@blogverse.com",
    role: "instructor",
  },
  {
    username: "Maya Chen",
    email: "maya@blogverse.com",
    role: "student",
  },
  {
    username: "James Wilson",
    email: "james@blogverse.com",
    role: "student",
  },
  {
    username: "Ayesha Noor",
    email: "ayesha@blogverse.com",
    role: "student",
  },
  {
    username: "Leo Martinez",
    email: "leo@blogverse.com",
    role: "student",
  },
];

function p(...paras) {
  return paras.map((text) => `<p>${text}</p>`).join("");
}

async function upsertUsers(passwordHash) {
  const byKey = {};
  for (const seed of userSeeds) {
    const user = await User.findOneAndUpdate(
      { email: seed.email },
      {
        $set: {
          username: seed.username,
          role: seed.role,
          password: passwordHash,
        },
        $setOnInsert: { email: seed.email },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    byKey[seed.email] = user;
    console.log(`✓ user ${user.username} <${user.email}> (${user.role})`);
  }
  return byKey;
}

async function seedBlogs(users) {
  const admin = users["admin@blogverse.com"];
  const sara = users["sara@blogverse.com"];
  const omar = users["omar@blogverse.com"];
  const maya = users["maya@blogverse.com"];
  const james = users["james@blogverse.com"];
  const ayesha = users["ayesha@blogverse.com"];
  const leo = users["leo@blogverse.com"];

  const blogDefs = [
    {
      title: "Getting Started with Modern React",
      author: sara,
      coverImage:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80",
      likedBy: [maya, james, leo, admin],
      content: p(
        "React has matured into a stable foundation for building interactive UIs. This guide walks through components, props, and state with practical patterns you can use today.",
        "Start with functional components and hooks. Prefer clear data flow from parent to child, and keep side effects inside <code>useEffect</code> with intentional dependencies.",
        "When your UI grows, split screens into presentational pieces and a thin data layer so each file stays easy to reason about.",
      ),
      comments: [
        {
          author: maya,
          content: "Clear intro — the hooks section helped me finally get effects right.",
        },
        {
          author: james,
          content: "Would love a follow-up on React Router and data loaders.",
        },
      ],
    },
    {
      title: "Designing Readable API Responses",
      author: omar,
      coverImage:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80",
      likedBy: [sara, ayesha, james],
      content: p(
        "A consistent JSON shape saves frontend teams hours of defensive coding. Prefer <code>{ success, message, data }</code> and keep error messages actionable.",
        "Pagination should always return <code>page</code>, <code>limit</code>, <code>total</code>, and <code>pages</code> so clients never guess how to build next links.",
        "Document status codes honestly: 400 for validation, 401 for missing auth, 403 for forbidden roles, and 404 only when the resource truly does not exist.",
      ),
      comments: [
        {
          author: sara,
          content: "We adopted this envelope on Blog Verse and debugging got much easier.",
        },
      ],
    },
    {
      title: "CSS That Ages Well",
      author: sara,
      coverImage:
        "https://images.unsplash.com/photo-1507721999472-57bd79332b11?w=1200&q=80",
      likedBy: [leo, maya],
      content: p(
        "Utility-first CSS is fast to ship, but design tokens keep a product cohesive. Define color, spacing, and type scales once, then compose layouts from those primitives.",
        "Avoid one-off magic numbers. If a spacing value appears twice, it probably belongs in a variable.",
        "Mobile-first media queries reduce overrides and make responsive bugs easier to spot.",
      ),
      comments: [
        {
          author: leo,
          content: "The token advice alone was worth the read.",
        },
        {
          author: ayesha,
          content: "Do you recommend CSS modules or Tailwind for learning projects?",
        },
        {
          author: sara,
          content: "Either works — pick one system and stay consistent across pages.",
        },
      ],
    },
    {
      title: "MongoDB Modeling Tips for Learning Apps",
      author: omar,
      coverImage:
        "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&q=80",
      likedBy: [admin, maya, james, ayesha, leo],
      content: p(
        "Embed when data is always read together and rarely grows unbounded. Reference when entities have independent lifecycles — users, blogs, and courses are classic examples.",
        "Keep denormalized fields like <code>authorName</code> and <code>likesCount</code> in sync on write. They make list endpoints cheap.",
        "Index the queries you actually run: newest content, likes by user, and text search on titles.",
      ),
      comments: [
        {
          author: admin,
          content: "Solid reminder about denormalized counters.",
        },
      ],
    },
    {
      title: "Study Notes: Building Focus Habits",
      author: maya,
      coverImage:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
      likedBy: [james, ayesha],
      content: p(
        "Deep work is a skill. Block 45-minute sessions, silence notifications, and write a one-line goal before you open the editor.",
        "After each session, jot what blocked you. Patterns appear quickly — unclear requirements, missing examples, or context switching.",
        "Celebrate shipped slices, not perfect plans. Small pull requests keep momentum high.",
      ),
      comments: [],
    },
    {
      title: "From Tutorial Hell to Real Projects",
      author: james,
      coverImage:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
      likedBy: [sara, maya, leo, ayesha],
      content: p(
        "Tutorials teach syntax. Projects teach judgment. Pick a tiny product idea and constrain the scope to one user journey.",
        "Ship a vertical slice: auth, one create form, one list page, and one detail page. Then iterate with feedback.",
        "When stuck, read the docs for the exact API you are calling before watching another video.",
      ),
      comments: [
        {
          author: leo,
          content: "This is exactly the nudge I needed this week.",
        },
        {
          author: omar,
          content: "Great advice for students joining our courses.",
        },
      ],
    },
  ];

  const blogs = [];
  for (const def of blogDefs) {
    const content = def.content;
    const likedBy = def.likedBy.map((u) => u._id);
    const blog = await Blog.create({
      title: def.title,
      content,
      excerpt: buildExcerpt(content),
      coverImage: def.coverImage,
      author: def.author._id,
      authorName: def.author.username,
      likedBy,
      likesCount: likedBy.length,
    });

    for (const c of def.comments) {
      await Comment.create({
        blog: blog._id,
        author: c.author._id,
        authorName: c.author.username,
        content: c.content,
      });
    }

    blogs.push(blog);
    console.log(
      `✓ blog "${blog.title}" (${blog.likesCount} likes, ${def.comments.length} comments)`,
    );
  }

  return blogs;
}

async function seedCourses(users) {
  const sara = users["sara@blogverse.com"];
  const omar = users["omar@blogverse.com"];
  const maya = users["maya@blogverse.com"];
  const james = users["james@blogverse.com"];
  const ayesha = users["ayesha@blogverse.com"];
  const leo = users["leo@blogverse.com"];

  const courseDefs = [
    {
      title: "React Fundamentals",
      instructor: sara,
      price: 49,
      image:
        "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1200&q=80",
      description:
        "Learn components, props, state, and hooks by building small interactive UI features. Ideal for beginners who know basic JavaScript.",
      students: [maya, james, leo, ayesha],
      lessons: [
        {
          title: "Welcome and Course Setup",
          order: 1,
          videoUrl: "https://www.youtube.com/watch?v=dGcsHMXbSOA",
          content: p(
            "Install Node.js, create a Vite React app, and take a tour of the project structure we will use throughout the course.",
          ),
        },
        {
          title: "Components and Props",
          order: 2,
          videoUrl: "https://www.youtube.com/watch?v=Ke90Tje7VS0",
          content: p(
            "Break the UI into reusable components and pass data with props. Practice composing cards, buttons, and layout shells.",
          ),
        },
        {
          title: "State and Events",
          order: 3,
          videoUrl: "",
          content: p(
            "Use <code>useState</code> to track form inputs and toggles. Wire click and submit handlers without mutating state directly.",
          ),
        },
        {
          title: "Effects and Data Fetching",
          order: 4,
          videoUrl: "",
          content: p(
            "Fetch blog data from an API, handle loading and error states, and clean up subscriptions when components unmount.",
          ),
        },
      ],
      reviews: [
        {
          author: maya,
          rating: 5,
          content: "Clear pacing and useful exercises. Finally comfortable with hooks.",
        },
        {
          author: james,
          rating: 4,
          content: "Great fundamentals. Would love one more lesson on custom hooks.",
        },
        {
          author: leo,
          rating: 5,
          content: "Best intro course I have taken so far.",
        },
      ],
    },
    {
      title: "Full-Stack Blog with Node and MongoDB",
      instructor: omar,
      price: 79,
      image:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80",
      description:
        "Build a blog API with Express and Mongoose, then connect a React client for auth, posts, comments, and likes.",
      students: [maya, james, ayesha],
      lessons: [
        {
          title: "API Design and Project Structure",
          order: 1,
          videoUrl: "",
          content: p(
            "Map routes, controllers, and models. Decide which resources are public and which require authentication.",
          ),
        },
        {
          title: "Auth with JWT Cookies",
          order: 2,
          videoUrl: "https://www.youtube.com/watch?v=mbsmsi7l3r4",
          content: p(
            "Register and login users, hash passwords with bcrypt, and issue httpOnly cookies for session security.",
          ),
        },
        {
          title: "Blogs, Likes, and Comments",
          order: 3,
          videoUrl: "",
          content: p(
            "Implement CRUD for blogs, toggle likes with a likedBy array, and nest comments under each post.",
          ),
        },
        {
          title: "Connecting the React Client",
          order: 4,
          videoUrl: "",
          content: p(
            "Call the API with credentials, protect routes on the frontend, and keep AuthContext in sync after login and logout.",
          ),
        },
        {
          title: "Deploy Checklist",
          order: 5,
          videoUrl: "",
          content: p(
            "Set environment variables, configure CORS for your frontend origin, and verify cookie settings for production.",
          ),
        },
      ],
      reviews: [
        {
          author: ayesha,
          rating: 5,
          content: "Loved building a real API end to end.",
        },
        {
          author: maya,
          rating: 4,
          content: "Auth section was especially practical.",
        },
      ],
    },
    {
      title: "UI Craft for Developers",
      instructor: sara,
      price: 39,
      image:
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80",
      description:
        "Improve visual hierarchy, spacing, typography, and motion so your learning projects look intentional instead of generic.",
      students: [leo, james],
      lessons: [
        {
          title: "Visual Hierarchy Basics",
          order: 1,
          videoUrl: "",
          content: p(
            "Use type scale, contrast, and whitespace so readers know what to look at first on every screen.",
          ),
        },
        {
          title: "Spacing Systems",
          order: 2,
          videoUrl: "",
          content: p(
            "Adopt an 4/8 spacing scale and apply it consistently to margins, gaps, and padding.",
          ),
        },
        {
          title: "Subtle Motion",
          order: 3,
          videoUrl: "",
          content: p(
            "Add page enter transitions and hover states that reinforce hierarchy without distracting from content.",
          ),
        },
      ],
      reviews: [
        {
          author: leo,
          rating: 5,
          content: "My portfolio looks twice as polished after this.",
        },
      ],
    },
    {
      title: "JavaScript Essentials for React",
      instructor: omar,
      price: 0,
      image:
        "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=1200&q=80",
      description:
        "A free primer covering ES modules, array methods, async/await, and destructuring — the JavaScript you need before React feels natural.",
      students: [maya, james, ayesha, leo],
      lessons: [
        {
          title: "Modern Syntax Tour",
          order: 1,
          videoUrl: "https://www.youtube.com/watch?v=NCwa_xi0Uuc",
          content: p(
            "Review let/const, template strings, arrow functions, and object shorthand with short drills.",
          ),
        },
        {
          title: "Arrays and Objects",
          order: 2,
          videoUrl: "",
          content: p(
            "Practice map, filter, find, and reduce on blog-like data shapes you will see in real apps.",
          ),
        },
        {
          title: "Async JavaScript",
          order: 3,
          videoUrl: "",
          content: p(
            "Understand promises and async/await, then fetch JSON and handle failures cleanly.",
          ),
        },
      ],
      reviews: [
        {
          author: james,
          rating: 5,
          content: "Perfect free warm-up before the React course.",
        },
        {
          author: ayesha,
          rating: 4,
          content: "Short and focused. The array drills were useful.",
        },
        {
          author: maya,
          rating: 5,
          content: "Filled gaps I did not know I had.",
        },
      ],
    },
  ];

  const courses = [];
  for (const def of courseDefs) {
    const slug = await makeUniqueSlug(Course, slugify(def.title));
    const students = def.students.map((u) => u._id);
    const avg =
      def.reviews.reduce((sum, r) => sum + r.rating, 0) / def.reviews.length;

    const course = await Course.create({
      title: def.title,
      slug,
      description: def.description,
      price: def.price,
      image: def.image,
      instructor: def.instructor._id,
      students,
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: def.reviews.length,
    });

    for (const lesson of def.lessons) {
      await Lesson.create({
        course: course._id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.videoUrl || "",
        order: lesson.order,
      });
    }

    for (const review of def.reviews) {
      await Review.create({
        course: course._id,
        author: review.author._id,
        authorName: review.author.username,
        rating: review.rating,
        content: review.content,
      });
    }

    courses.push(course);
    console.log(
      `✓ course "${course.title}" (${def.lessons.length} lessons, ${def.reviews.length} reviews, ${students.length} students)`,
    );
  }

  return courses;
}

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to MongoDB (${mongoose.connection.name})`);

  console.log("\nClearing blogs, comments, courses, lessons, reviews...");
  await Promise.all([
    Blog.deleteMany({}),
    Comment.deleteMany({}),
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Review.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

  console.log("\nSeeding users...");
  const users = await upsertUsers(passwordHash);

  console.log("\nSeeding blogs, likes, and comments...");
  await seedBlogs(users);

  console.log("\nSeeding courses, lessons, and reviews...");
  await seedCourses(users);

  const counts = {
    users: await User.countDocuments(),
    blogs: await Blog.countDocuments(),
    comments: await Comment.countDocuments(),
    courses: await Course.countDocuments(),
    lessons: await Lesson.countDocuments(),
    reviews: await Review.countDocuments(),
  };

  console.log("\nSeed complete:");
  console.table(counts);
  console.log(`Login password for all seeded users: ${SEED_PASSWORD}`);
  console.log("Accounts:");
  for (const u of userSeeds) {
    console.log(`  - ${u.email} (${u.role})`);
  }

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
