# Blog Verse

Full-stack learning platform with a React frontend and Express + MongoDB backend. Users can sign up, log in, manage blog posts and comments, browse and enroll in courses with lessons, search and filter content, and manage their profile. Access is role-based (`student`, `instructor`, `admin`).

## Tech Stack

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Frontend | React 19, Vite, React Router, Tailwind CSS |
| Backend  | Express, Mongoose, JWT, bcryptjs           |
| Database | MongoDB                                    |

## Project Structure

```
blog-verse/
├── React Js/                 # Frontend (Vite + React)
│   └── src/
│       ├── api/              # API client
│       ├── components/       # Pages & UI
│       └── context/          # Auth context
└── backend/                  # Express API
    ├── controller/
    ├── middleware/           # JWT protect + role authorize
    ├── models/               # User, Blog, Comment, Course, Lesson
    ├── routes/
    ├── scripts/              # One-off migrations
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

App runs at `http://localhost:5173`.

## Features

- User signup and login (JWT)
- Roles: `student`, `instructor`, `admin` (signup allows student/instructor only; set admin in the database)
- Blog CRUD with author ownership (owner or admin can edit/delete)
- Blog comments (post comments; delete own; admin can moderate)
- Search blogs by title
- Pagination for blogs and courses (`?page=1&limit=10`)
- Courses with slug URLs
- Instructors/admins can create and update courses; admin can delete
- Course search and filters (title, min/max price, instructor)
- Course lessons (title, content, video URL, order) — enrolled students, course instructor, or admin can open them
- Students can enroll / unenroll and view **My Courses**
- Profile page (update username/email)
- Change password on Profile (verify current password, bcrypt hash)
- Admin users page (list and delete users; promote student ↔ instructor)
- Protected routes (login required)

## Frontend Routes

| Path                                | Description              | Auth | Notes                          |
| ----------------------------------- | ------------------------ | ---- | ------------------------------ |
| `/login`                            | Log in                   | No   |                                |
| `/signup`                           | Sign up                  | No   |                                |
| `/`                                 | Home / blogs + search    | Yes  |                                |
| `/blogs/new`                        | Create blog              | Yes  |                                |
| `/blogs/:id`                        | Blog detail + comments   | Yes  |                                |
| `/courses`                          | Course list + filters    | Yes  |                                |
| `/my-courses`                       | Enrolled courses         | Yes  | Students                       |
| `/courses/new`                      | Create course            | Yes  | Instructor / admin             |
| `/courses/:slug`                    | Course detail + lessons  | Yes  |                                |
| `/courses/:slug/lessons/:lessonId`  | Lesson detail            | Yes  | Enrolled / instructor / admin  |
| `/profile`                          | Profile + change password| Yes  |                                |
| `/admin/users`                      | Manage users + roles     | Yes  | Admin only                     |

## API Endpoints

### Auth — `/api/auth`

| Method | Path      | Description                          |
| ------ | --------- | ------------------------------------ |
| POST   | `/signup` | Register (`student` or `instructor`) |
| POST   | `/login`  | Log in                               |

### Blogs — `/api/blog`

| Method | Path                         | Access        | Description                          |
| ------ | ---------------------------- | ------------- | ------------------------------------ |
| GET    | `/all`                       | Public        | List blogs (`?search=&page=&limit=`) |
| GET    | `/:id`                       | Public        | Get one blog                         |
| POST   | `/create`                    | auth          | Create a blog                        |
| PUT    | `/:id`                       | owner, admin  | Update a blog                        |
| DELETE | `/:id`                       | owner, admin  | Delete a blog (+ its comments)       |
| GET    | `/:id/comments`              | Public        | List comments                        |
| POST   | `/:id/comments`              | auth          | Add a comment                        |
| DELETE | `/:id/comments/:commentId`   | owner, admin  | Delete a comment                     |

### Courses — `/api/course`

| Method | Path                        | Access                   | Description                                      |
| ------ | --------------------------- | ------------------------ | ------------------------------------------------ |
| GET    | `/`                         | Public                   | List courses (`?search=&minPrice=&maxPrice=&instructor=&page=&limit=`) |
| GET    | `/instructors`              | Public                   | Instructors that have courses (for filters)      |
| GET    | `/my`                       | student                  | Courses the logged-in student is enrolled in     |
| GET    | `/:slug`                    | Public                   | Get course by slug                               |
| POST   | `/`                         | instructor, admin        | Create course                                    |
| PUT    | `/:slug`                    | instructor, admin        | Update course                                    |
| DELETE | `/:slug`                    | admin                    | Delete course (+ its lessons)                    |
| POST   | `/:slug/enroll`             | student                  | Enroll                                           |
| POST   | `/:slug/unenroll`           | student                  | Unenroll                                         |
| GET    | `/:slug/lessons`            | enrolled / instructor / admin | List lessons                            |
| GET    | `/:slug/lessons/:lessonId`  | enrolled / instructor / admin | Get one lesson                          |
| POST   | `/:slug/lessons`            | course instructor, admin | Create lesson                                    |
| PUT    | `/:slug/lessons/:lessonId`  | course instructor, admin | Update lesson                                    |
| DELETE | `/:slug/lessons/:lessonId`  | course instructor, admin | Delete lesson                                    |

### Users — `/api/user`

| Method | Path            | Access        | Description                                        |
| ------ | --------------- | ------------- | -------------------------------------------------- |
| GET    | `/`             | admin         | List all users                                     |
| GET    | `/:id`          | auth          | Get one user                                       |
| PUT    | `/:id`          | owner, admin  | Update username / email                            |
| PUT    | `/:id/role`     | admin         | Set role to `student` or `instructor`              |
| PUT    | `/:id/password` | owner         | Change password (`currentPassword`, `newPassword`) |
| DELETE | `/:id`          | admin         | Delete user                                        |

## Scripts

**Backend**

| Command                 | Description             |
| ----------------------- | ----------------------- |
| `npm run dev`           | Start with nodemon      |
| `npm start`             | Start production server |
| `npm run migrate:slugs` | Backfill course slugs   |

**Frontend**

| Command           | Description      |
| ----------------- | ---------------- |
| `npm run dev`     | Vite dev server  |
| `npm run build`   | Production build |
| `npm run preview` | Preview build    |
| `npm run lint`    | Run oxlint       |
