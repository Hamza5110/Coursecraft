import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { changePassword, getUser, updateUser } from "../api/blogApi";

function Profile() {
  const navigate = useNavigate();
  const { user, updateUser: updateAuthUser, logout } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    currentPassword: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await getUser(user.id);
        const next = data.user;
        setForm({
          username: next.username || "",
          email: next.email || "",
        });
        updateAuthUser({
          id: next.id,
          username: next.username,
          email: next.email,
          role: next.role,
        });
      } catch (err) {
        setError(err.message);
        setForm({
          username: user.username || "",
          email: user.email || "",
          currentPassword: "",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const emailChanged =
        form.email.trim().toLowerCase() !==
        String(user.email || "").toLowerCase();
      if (emailChanged && !form.currentPassword) {
        setError("Current password is required to change email");
        setSaving(false);
        return;
      }
      const data = await updateUser(user.id, {
        username: form.username.trim(),
        email: form.email.trim(),
        ...(emailChanged
          ? { currentPassword: form.currentPassword }
          : {}),
      });
      updateAuthUser(data.user);
      setForm((prev) => ({ ...prev, currentPassword: "" }));
      setMessage(data.message || "Profile updated successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setPasswordError("");
    setPasswordMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }

    const nextPassword = String(passwordForm.newPassword);
    if (
      nextPassword.length < 8 ||
      !/[A-Za-z]/.test(nextPassword) ||
      !/[0-9]/.test(nextPassword)
    ) {
      setPasswordError(
        "Password must be at least 8 characters and include a letter and a number",
      );
      return;
    }

    setSavingPassword(true);
    try {
      const data = await changePassword(user.id, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage(
        data.message || "Password updated. Please log in again.",
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      logout();
      navigate("/login", {
        replace: true,
        state: { message: "Password updated. Please log in again." },
      });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (user?.username || user?.email || "U")
    .slice(0, 1)
    .toUpperCase();

  return (
    <>
      <section className="min-h-[70vh] bg-gray-100 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Profile</h1>
            <Link to="/" className="text-blue-600 hover:underline">
              Back to Home
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg mb-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {user?.username || "User"}
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="mt-1 inline-block text-xs capitalize bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                {user?.role || "student"}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-lg mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Edit details</h2>

            {loading && <p className="text-gray-500 mb-3">Loading profile...</p>}
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            {message && <p className="text-green-600 text-sm mb-3">{message}</p>}

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              type="text"
              className="w-full border p-2 rounded mb-4"
              required
            />

            <label
              htmlFor="profile-email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="profile-email"
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              className="mb-4 w-full rounded border p-2"
              required
            />

            <label
              htmlFor="profile-current-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Current password (required to change email)
            </label>
            <input
              id="profile-current-password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              type="password"
              autoComplete="current-password"
              className="mb-4 w-full rounded border p-2"
            />

            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <input
              value={user?.role || "student"}
              type="text"
              className="mb-4 w-full rounded border bg-gray-50 p-2 capitalize"
              disabled
            />

            <button
              type="submit"
              disabled={saving || loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-4">Change password</h2>

            {passwordError && (
              <p className="text-red-500 text-sm mb-3">{passwordError}</p>
            )}
            {passwordMessage && (
              <p className="text-green-600 text-sm mb-3">{passwordMessage}</p>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current password
            </label>
            <input
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              type="password"
              className="w-full border p-2 rounded mb-4"
              required
              autoComplete="current-password"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              type="password"
              className="w-full border p-2 rounded mb-4"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              type="password"
              className="w-full border p-2 rounded mb-4"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={savingPassword}
              className="bg-blue-500 text-white rounded-md px-4 w-full py-2 hover:bg-blue-600 disabled:opacity-60"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

export default Profile;
