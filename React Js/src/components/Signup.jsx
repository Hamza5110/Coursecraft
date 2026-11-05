import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/blogApi";
import Alert from "./ui/Alert";
import Button from "./ui/Button";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await signup(form);
      if (!data.success) throw new Error(data.message || "Signup Failed");
      navigate("/login", {
        state: { message: "Account created. You can log in now." },
      });
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
        noValidate
      >
        <h1 className="mb-2 text-center font-display text-2xl font-bold">
          Create your account
        </h1>
        <p className="mb-5 text-center text-sm text-gray-500">
          New accounts start as students. Instructors are approved by an admin.
        </p>
        {error && <Alert className="mb-3">{error}</Alert>}
        <label htmlFor="signup-username" className="mb-1 block text-sm font-medium">
          Username
        </label>
        <input
          id="signup-username"
          name="username"
          value={form.username}
          onChange={handleChange}
          type="text"
          autoComplete="username"
          className="mb-4 w-full rounded-lg border border-gray-200 p-2"
          required
        />
        <label htmlFor="signup-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
          autoComplete="email"
          className="mb-4 w-full rounded-lg border border-gray-200 p-2"
          required
        />
        <label
          htmlFor="signup-password"
          className="mb-1 block text-sm font-medium"
        >
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          value={form.password}
          onChange={handleChange}
          type="password"
          autoComplete="new-password"
          className="mb-1 w-full rounded-lg border border-gray-200 p-2"
          required
          minLength={8}
        />
        <p className="mb-4 text-xs text-gray-500">At least 8 characters.</p>
        <Button type="submit" className="w-full" loading={loading}>
          Sign up
        </Button>
        <p className="mt-3 text-center text-sm">
          Already have an account?{" "}
          <Link className="text-blue-700 hover:underline" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;
