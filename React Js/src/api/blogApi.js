const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const API_BASE = `${API_ORIGIN}/api`;

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function mediaUrl(path) {
  if (!path) return "";
  const value = String(path).trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.protocol === "http:" || url.protocol === "https:") return value;
    } catch {
      return "";
    }
    return "";
  }

  if (value.startsWith("/uploads/") && !value.includes("..")) {
    return `${API_ORIGIN}${value}`;
  }

  if (value.startsWith("/") && !value.includes("..")) {
    return `${API_ORIGIN}${value}`;
  }

  return "";
}

function jsonHeaders(hasBody = false) {
  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
  };
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse(res) {
  if (res.status === 401) {
    onUnauthorized?.();
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        res.ok ? "Invalid server response" : "Request failed",
        res.status,
      );
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.message || "Request failed", res.status);
  }
  return data;
}

async function request(path, { method = "GET", body, signal } = {}) {
  const hasBody = body !== undefined;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: jsonHeaders(hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal,
  });
  return handleResponse(res);
}

function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function uploadImage(file) {
  const body = new FormData();
  body.append("image", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body,
    credentials: "include",
  });
  return handleResponse(res);
}

export const signup = (payload) => request("/auth/signup", { method: "POST", body: payload });
export const login = (payload) => request("/auth/login", { method: "POST", body: payload });
export const logout = () => request("/auth/logout", { method: "POST", body: {} });
export const getMe = (signal) => request("/auth/me", { signal });
export const forgotPassword = (payload) =>
  request("/auth/forgot-password", { method: "POST", body: payload });
export const resetPassword = (payload) =>
  request("/auth/reset-password", { method: "POST", body: payload });

export const getAllBlogs = (params = {}, signal) =>
  request(`/blog/all${toQuery(params)}`, { signal });
export const getBlogById = (id, signal) => request(`/blog/${id}`, { signal });
export const createBlog = (payload) =>
  request("/blog/create", { method: "POST", body: payload });
export const updateBlog = (id, payload) =>
  request(`/blog/${id}`, { method: "PUT", body: payload });
export const deleteBlog = (id) => request(`/blog/${id}`, { method: "DELETE" });
export const toggleBlogLike = (id) =>
  request(`/blog/${id}/like`, { method: "POST" });
export const getLikedBlogs = (params = {}, signal) =>
  request(`/blog/liked${toQuery(params)}`, { signal });

export const getBlogComments = (blogId, signal) =>
  request(`/blog/${blogId}/comments`, { signal });
export const createComment = (blogId, payload) =>
  request(`/blog/${blogId}/comments`, { method: "POST", body: payload });
export const deleteComment = (blogId, commentId) =>
  request(`/blog/${blogId}/comments/${commentId}`, { method: "DELETE" });

export const getAllCourses = (params = {}, signal) =>
  request(`/course${toQuery(params)}`, { signal });
export const getCourseInstructors = (signal) =>
  request("/course/instructors", { signal });
export const getMyCourses = (signal) => request("/course/my", { signal });
export const getTeachingCourses = (signal) =>
  request("/course/teaching", { signal });
export const getCourseBySlug = (slug, signal) =>
  request(`/course/${slug}`, { signal });
export const createCourse = (payload) =>
  request("/course", { method: "POST", body: payload });
export const updateCourse = (slug, payload) =>
  request(`/course/${slug}`, { method: "PUT", body: payload });
export const deleteCourse = (slug) =>
  request(`/course/${slug}`, { method: "DELETE" });
export const enrollInCourse = (slug) =>
  request(`/course/${slug}/enroll`, { method: "POST" });
export const unenrollFromCourse = (slug) =>
  request(`/course/${slug}/unenroll`, { method: "POST" });

export const getCourseLessons = (slug, signal) =>
  request(`/course/${slug}/lessons`, { signal });
export const getCourseReviews = (slug, signal) =>
  request(`/course/${slug}/reviews`, { signal });
export const createCourseReview = (slug, payload) =>
  request(`/course/${slug}/reviews`, { method: "POST", body: payload });
export const updateCourseReview = (slug, reviewId, payload) =>
  request(`/course/${slug}/reviews/${reviewId}`, {
    method: "PUT",
    body: payload,
  });
export const deleteCourseReview = (slug, reviewId) =>
  request(`/course/${slug}/reviews/${reviewId}`, { method: "DELETE" });

export const getLesson = (slug, lessonId, signal) =>
  request(`/course/${slug}/lessons/${lessonId}`, { signal });
export const createLesson = (slug, payload) =>
  request(`/course/${slug}/lessons`, { method: "POST", body: payload });
export const updateLesson = (slug, lessonId, payload) =>
  request(`/course/${slug}/lessons/${lessonId}`, {
    method: "PUT",
    body: payload,
  });
export const deleteLesson = (slug, lessonId) =>
  request(`/course/${slug}/lessons/${lessonId}`, { method: "DELETE" });

export const getUser = (id) => request(`/user/${id}`);
export const getAllUsers = () => request("/user");
export const updateUser = (id, payload) =>
  request(`/user/${id}`, { method: "PUT", body: payload });
export const changePassword = (id, payload) =>
  request(`/user/${id}/password`, { method: "PUT", body: payload });
export const updateUserRole = (id, role) =>
  request(`/user/${id}/role`, { method: "PUT", body: { role } });
export const deleteUser = (id) => request(`/user/${id}`, { method: "DELETE" });
