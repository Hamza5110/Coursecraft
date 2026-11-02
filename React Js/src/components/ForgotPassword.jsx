import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/blogApi";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await forgotPassword({ email: email.trim() });
      setMessage(
        data.message ||
          "If an account exists for that email, a reset link has been sent.",
      );
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
        <h2 className="text-2xl font-bold text-center mb-2">Forgot password</h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          Enter your email and we&apos;ll send a reset link.
        </p>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
        <input
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded mb-4"
          required
        />
        <button
          disabled={loading}
          className="bg-blue-500 text-white rounded-md px-4 w-full py-2 hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
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

export default ForgotPassword;
