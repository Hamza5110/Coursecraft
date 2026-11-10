import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/blogApi";
import Alert from "./ui/Alert";
import Button from "./ui/Button";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
      >
        <h1 className="mb-2 text-center font-display text-2xl font-bold">
          Forgot password
        </h1>
        <p className="mb-5 text-center text-sm text-gray-500">
          Enter your email and we&apos;ll send a reset link.
        </p>
        {error && <Alert className="mb-3">{error}</Alert>}
        {message && (
          <Alert type="success" className="mb-3">
            {message}
          </Alert>
        )}
        <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="mb-4 w-full rounded-lg border border-gray-200 p-2"
          required
        />
        <Button type="submit" className="w-full" loading={loading}>
          Send reset link
        </Button>
        <p className="mt-3 text-center text-sm">
          <Link className="text-blue-700 hover:underline" to="/login">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;
