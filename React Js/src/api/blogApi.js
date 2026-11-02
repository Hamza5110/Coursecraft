const API_ORIGIN = "http://localhost:5000";
const API_BASE = `${API_ORIGIN}/api`;

export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

function authHeadersMultipart() {
  const token = localStorage.getItem("token");
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function uploadImage(file) {
  const body = new FormData();
  body.append("image", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: authHeadersMultipart(),
    body,
  });
  return handleResponse(res);
}

export async function signup(payload) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function login(payload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function forgotPassword(payload) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function resetPassword(payload) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getAllBlogs(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  const qs = query.toString();
  const res = await fetch(`${API_BASE}/blog/all${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getBlogById(id) {
  const res = await fetch(`${API_BASE}/blog/${id}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createBlog(payload) {
  const res = await fetch(`${API_BASE}/blog/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateBlog(id, payload) {
  const res = await fetch(`${API_BASE}/blog/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteBlog(id) {
  const res = await fetch(`${API_BASE}/blog/${id}`, { method: "DELETE", headers: authHeaders() });
  return handleResponse(res);
}

export async function toggleBlogLike(id) {
  const res = await fetch(`${API_BASE}/blog/${id}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getLikedBlogs(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  const qs = query.toString();
  const res = await fetch(`${API_BASE}/blog/liked${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getBlogComments(blogId) {
  const res = await fetch(`${API_BASE}/blog/${blogId}/comments`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createComment(blogId, payload) {
  const res = await fetch(`${API_BASE}/blog/${blogId}/comments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteComment(blogId, commentId) {
  const res = await fetch(
    `${API_BASE}/blog/${blogId}/comments/${commentId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
  );
  return handleResponse(res);
}

export async function getAllCourses(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.minPrice !== undefined && params.minPrice !== "") {
    query.set("minPrice", params.minPrice);
  }
  if (params.maxPrice !== undefined && params.maxPrice !== "") {
    query.set("maxPrice", params.maxPrice);
  }
  if (params.instructor) query.set("instructor", params.instructor);
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  const qs = query.toString();
  const res = await fetch(`${API_BASE}/course${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getCourseInstructors() {
  const res = await fetch(`${API_BASE}/course/instructors`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getMyCourses() {
  const res = await fetch(`${API_BASE}/course/my`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getTeachingCourses() {
  const res = await fetch(`${API_BASE}/course/teaching`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getCourseBySlug(slug) {
  const res = await fetch(`${API_BASE}/course/${slug}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createCourse(payload) {
  const res = await fetch(`${API_BASE}/course`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateCourse(slug, payload) {
  const res = await fetch(`${API_BASE}/course/${slug}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteCourse(slug) {
  const res = await fetch(`${API_BASE}/course/${slug}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function enrollInCourse(slug) {
  const res = await fetch(`${API_BASE}/course/${slug}/enroll`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function unenrollFromCourse(slug) {
  const res = await fetch(`${API_BASE}/course/${slug}/unenroll`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getCourseLessons(slug) {
  const res = await fetch(`${API_BASE}/course/${slug}/lessons`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getLesson(slug, lessonId) {
  const res = await fetch(`${API_BASE}/course/${slug}/lessons/${lessonId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createLesson(slug, payload) {
  const res = await fetch(`${API_BASE}/course/${slug}/lessons`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateLesson(slug, lessonId, payload) {
  const res = await fetch(`${API_BASE}/course/${slug}/lessons/${lessonId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteLesson(slug, lessonId) {
  const res = await fetch(`${API_BASE}/course/${slug}/lessons/${lessonId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getUser(id) {
  const res = await fetch(`${API_BASE}/user/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getAllUsers() {
  const res = await fetch(`${API_BASE}/user`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function updateUser(id, payload) {
  const res = await fetch(`${API_BASE}/user/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function changePassword(id, payload) {
  const res = await fetch(`${API_BASE}/user/${id}/password`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateUserRole(id, role) {
  const res = await fetch(`${API_BASE}/user/${id}/role`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/user/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}