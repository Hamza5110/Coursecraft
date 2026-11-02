import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/blogApi";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Missing or invalid reset token. Request a new link.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword({
        token,
        newPassword: form.newPassword,
      });
      setMessage(data.message || "Password reset successfully");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-80 p-6 rounded-xl shadow-lg"
      >
        <h2 className="text-2xl font-bold text-center mb-5">Reset password</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
        {!token && (
          <p className="text-amber-600 text-sm mb-3">
            No token found in the URL. Open the link from your email, or{" "}
            <Link className="underline" to="/forgot-password">
              request a new one
            </Link>
            .
          </p>
        )}
        <input
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          type="password"
          placeholder="New password"
          className="w-full border p-2 rounded mb-4"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <input
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          type="password"
          placeholder="Confirm new password"
          className="w-full border p-2 rounded mb-4"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <button
          disabled={loading || !token}
          className="bg-blue-500 text-white rounded-md px-4 w-full py-2 hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Reset password"}
        </button>
        <p className="text-center mt-3 text-sm">
          <Link className="text-blue-600 hover:underline" to="/login">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default ResetPassword;
