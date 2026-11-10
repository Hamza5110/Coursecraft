# Coursecraft

Full-stack learning platform with a React frontend and Express + MongoDB backend. Users can sign up, log in, manage blog posts and comments, browse and enroll in courses with lessons, search and filter content, and manage their profile. Access is role-based (`student`, `instructor`, `admin`).

## Tech Stack

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Quill |
| Backend  | Express, Mongoose, JWT (httpOnly cookie), bcryptjs, Multer, Nodemailer |
| Database | MongoDB                                    |

## Project Structure

```
coursecraft/
├── React Js/                 # Frontend (Vite + React)
│   └── src/
│       ├── api/              # API client (credentials: include)
│       ├── components/       # Pages & UI
│       └── context/          # Auth context (session via /api/auth/me)
└── backend/                  # Express API
    ├── controller/
    ├── middleware/           # JWT protect + role authorize + Multer upload
    ├── models/               # User, Blog, Comment, Course, Lesson, Review
    ├── routes/
    ├── uploads/              # Local image storage (gitignored; single-server)
    ├── scripts/              # One-off migrations
    ├── tests/                # Node test runner smoke tests
    └── utils/
```

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

`JWT_SECRET` must be at least 32 characters (`openssl rand -hex 32`).

Optional SMTP (for real email). If omitted in development, Nodemailer uses an Ethereal test account and logs a preview URL in the backend console. **Production requires `SMTP_HOST`** (and typically the other SMTP vars):

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Coursecraft <noreply@example.com>"
```

Start the server:

```bash
npm run dev
```

API runs at `http://localhost:5000`.

If you have older courses without slugs:

```bash
npm run migrate:slugs
```

### 2. Frontend

```bash
cd "React Js"
npm install
npm run dev
```

App runs at `http://localhost:5173`. Set `VITE_API_URL` to the backend origin (see `.env.example`). The frontend sends cookies with every API request (`credentials: "include"`), so `FRONTEND_URL` on the backend must match the Vite origin exactly.

## Auth model

- Access JWT is stored in an **httpOnly** cookie (`bv_access`), not `localStorage`.
- Login sets the cookie; logout / password change / reset clears it.
- On load, the app calls `GET /api/auth/me` to restore the session.
- Passwords must be at least 8 characters and include a letter and a number.

## Features

- User signup and login (JWT cookie session)
- Forgot / reset password (short-lived JWT reset token + Nodemailer)
- Roles: `student`, `instructor`, `admin` (signup always creates `student`; admins promote instructors; set admin in the database)
- Blog CRUD with author ownership (owner or admin can edit/delete)
- Rich text editor (Quill) for blog and lesson content — headings, bold/italic, lists, quotes, code, links; HTML stored in MongoDB; legacy plain text still renders
- Image upload for blog/course covers (Multer → `backend/uploads`, served at `/uploads`) — local disk only; fine for a single server, not multi-instance deploys
- Blog likes / bookmarks (`likedBy` user IDs; toggle like; Liked page)
- Blog comments (post comments; delete own; admin can moderate)
- Search blogs by title
- Pagination for blogs and courses (`?page=1&limit=10`)
- Courses with slug URLs
- Instructors/admins can create courses; only the owning instructor (or admin) can update; admin can delete
- Course search and filters (title, min/max price, instructor)
- Course lessons (title, rich content, video URL, order) — enrolled students, course instructor, or admin can open them
- Students can enroll / unenroll and view **My Courses**
- Course ratings & reviews (1–5 stars + optional text; enrolled students only; one review per student; average shown on list/detail)
- Instructor dashboard — teaching courses, enrollment/lesson counts, open/edit from one place
- Profile page (update username/email)
- Change password on Profile (verify current password, bcrypt hash; clears session cookie)
- Admin users page (list and delete users; promote student ↔ instructor). Delete cascades blogs, comments, likes, enrollments, reviews, and instructor-owned courses/lessons
- Protected routes (login required for writing / account pages; home, blog detail, and course browse stay public)

## Frontend Routes

| Path                                | Description              | Auth | Notes                          |
| ----------------------------------- | ------------------------ | ---- | ------------------------------ |
| `/login`                            | Log in                   | No   |                                |
| `/signup`                           | Sign up                  | No   | Always creates a student       |
| `/forgot-password`                  | Request password reset   | No   |                                |
| `/reset-password`                   | Set new password         | No   | Uses `?token=` from email      |
| `/`                                 | Home / blogs + search    | No   | Public                         |
| `/blogs/new`                        | Create blog              | Yes  |                                |
| `/blogs/liked`                      | Liked / bookmarked blogs | Yes  |                                |
| `/blogs/:id`                        | Blog detail + comments   | No   | Like / write need login        |
| `/courses`                          | Course list + filters    | No   | Public                         |
| `/my-courses`                       | Enrolled courses         | Yes  | Students                       |
| `/instructor`                       | Instructor dashboard     | Yes  | Instructor / admin             |
| `/courses/new`                      | Create course            | Yes  | Instructor / admin             |
| `/courses/:slug`                    | Course detail + lessons + reviews | No | Enroll / rate need login |
| `/courses/:slug/lessons/:lessonId`  | Lesson detail            | Yes  | Enrolled / instructor / admin  |
| `/profile`                          | Profile + change password| Yes  |                                |
| `/admin/users`                      | Manage users + roles     | Yes  | Admin only                     |

## API Endpoints

### Auth — `/api/auth`

| Method | Path               | Description                                      |
| ------ | ------------------ | ------------------------------------------------ |
| POST   | `/signup`          | Register (always `student`)                      |
| POST   | `/login`           | Log in; sets httpOnly access cookie              |
| POST   | `/logout`          | Clear access cookie                              |
| GET    | `/me`              | Current user from cookie (auth required)         |
| POST   | `/forgot-password` | Email a reset link (JWT, 15m). Always generic OK |
| POST   | `/reset-password`  | Body: `{ token, newPassword }`                   |

### Blogs — `/api/blog`

| Method | Path                         | Access        | Description                          |
| ------ | ---------------------------- | ------------- | ------------------------------------ |
| GET    | `/all`                       | Public        | List blogs (`?search=&page=&limit=`) |
| GET    | `/liked`                     | auth          | Blogs liked by the current user      |
| GET    | `/:id`                       | Public        | Get one blog                         |
| POST   | `/create`                    | auth          | Create a blog                        |
| PUT    | `/:id`                       | owner, admin  | Update a blog                        |
| DELETE | `/:id`                       | owner, admin  | Delete a blog (+ its comments)       |
| POST   | `/:id/like`                  | auth          | Toggle like / bookmark               |
| GET    | `/:id/comments`              | Public        | List comments                        |
| POST   | `/:id/comments`              | auth          | Add a comment                        |
| DELETE | `/:id/comments/:commentId`   | owner, admin  | Delete a comment                     |

### Courses — `/api/course`

| Method | Path                        | Access                   | Description                                      |
| ------ | --------------------------- | ------------------------ | ------------------------------------------------ |
| GET    | `/`                         | Public                   | List courses (`?search=&minPrice=&maxPrice=&instructor=&page=&limit=`) |
| GET    | `/instructors`              | Public                   | Instructors that have courses (for filters)      |
| GET    | `/my`                       | student                  | Courses the logged-in student is enrolled in     |
| GET    | `/teaching`                 | instructor, admin        | Instructor dashboard courses + enrollment/lesson counts (admin sees all) |
| GET    | `/:slug`                    | Public                   | Get course by slug                               |
| POST   | `/`                         | instructor, admin        | Create course                                    |
| PUT    | `/:slug`                    | course instructor, admin | Update course (owner or admin only)              |
| DELETE | `/:slug`                    | admin                    | Delete course (+ its lessons and reviews)        |
| POST   | `/:slug/enroll`             | student                  | Enroll                                           |
| POST   | `/:slug/unenroll`           | student                  | Unenroll                                         |
| GET    | `/:slug/reviews`            | Public                   | List reviews + average / count                   |
| POST   | `/:slug/reviews`            | enrolled student         | Create review (`rating` 1–5, optional `content`) |
| PUT    | `/:slug/reviews/:reviewId`  | review owner             | Update own review                                |
| DELETE | `/:slug/reviews/:reviewId`  | owner, admin             | Delete a review                                  |
| GET    | `/:slug/lessons`            | enrolled / instructor / admin | List lessons                            |
| GET    | `/:slug/lessons/:lessonId`  | enrolled / instructor / admin | Get one lesson                          |
| POST   | `/:slug/lessons`            | course instructor, admin | Create lesson                                    |
| PUT    | `/:slug/lessons/:lessonId`  | course instructor, admin | Update lesson                                    |
| DELETE | `/:slug/lessons/:lessonId`  | course instructor, admin | Delete lesson                                    |

### Upload — `/api/upload`

| Method | Path | Access | Description |
| ------ | ---- | ------ | ----------- |
| POST   | `/`  | auth   | Upload an image (`multipart/form-data`, field name `image`). Returns `{ url: "/uploads/..." }` (max 5MB; jpeg/png/webp/gif). Files are stored in `backend/uploads` and served at `http://localhost:5000/uploads/...`. Suitable for a single-server deploy; use object storage if you scale out. You can still paste an external image URL in course/blog forms. |

### Users — `/api/user`

| Method | Path            | Access        | Description                                        |
| ------ | --------------- | ------------- | -------------------------------------------------- |
| GET    | `/`             | admin         | List all users                                     |
| GET    | `/:id`          | auth          | Get one user                                       |
| PUT    | `/:id`          | owner, admin  | Update username / email                            |
| PUT    | `/:id/role`     | admin         | Set role to `student` or `instructor`              |
| PUT    | `/:id/password` | owner         | Change password (`currentPassword`, `newPassword`) |
| DELETE | `/:id`          | admin         | Delete user + related blogs/courses/comments/etc.  |

## Scripts

**Backend**

| Command                 | Description             |
| ----------------------- | ----------------------- |
| `npm run dev`           | Start with nodemon      |
| `npm start`             | Start production server |
| `npm test`              | Run smoke unit tests    |
| `npm run migrate:slugs` | Backfill course slugs   |

**Frontend**

| Command           | Description      |
| ----------------- | ---------------- |
| `npm run dev`     | Vite dev server  |
| `npm run build`   | Production build |
| `npm run preview` | Preview build    |
| `npm run lint`    | Run oxlint       |
