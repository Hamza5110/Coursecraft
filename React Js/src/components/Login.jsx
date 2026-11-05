import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/blogApi";
import Alert from "./ui/Alert";
import Button from "./ui/Button";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: loginContext } = useAuth();
  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      if (!data.success) throw new Error(data.message || "Login failed");
      loginContext(data.token, data.user);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
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
        <h1 className="mb-5 text-center font-display text-2xl font-bold">
          Welcome back
        </h1>
        {successMessage && (
          <Alert type="success" className="mb-3">
            {successMessage}
          </Alert>
        )}
        {error && <Alert className="mb-3">{error}</Alert>}
        <label htmlFor="login-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
          autoComplete="email"
          className="mb-4 w-full rounded-lg border border-gray-200 p-2"
          required
        />
        <label
          htmlFor="login-password"
          className="mb-1 block text-sm font-medium"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          value={form.password}
          onChange={handleChange}
          type="password"
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-gray-200 p-2"
          required
        />
        <Button type="submit" className="w-full" loading={loading}>
          Log in
        </Button>
        <p className="mt-3 text-center text-sm">
          <Link className="text-blue-700 hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          New here?{" "}
          <Link className="text-blue-700 hover:underline" to="/signup">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
