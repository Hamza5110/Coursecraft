import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/blogApi";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: loginContext } = useAuth();

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
      navigate("/");
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
        <h2 className="text-2xl font-bold text-center mb-5">Login</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded mb-4"
          required
        />
        <input
          name="password"
          value={form.password}
          onChange={handleChange}
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded mb-4"
          required
        />
        <button
          disabled={loading}
          className="bg-blue-500 text-white rounded-md px-4 w-full py-2 hover:bg-blue-600"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-center mt-3 text-sm">
          <Link className="text-blue-600 hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </p>
        <p className="text-center mt-2">
          New Account?{" "}
          <Link className="text-blue-600 hover:underline" to="/signup">
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
