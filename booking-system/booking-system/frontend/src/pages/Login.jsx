import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("jane@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 px-6">
      <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
      <p className="text-sm text-[#8a8478] mb-8">Log in to manage your bookings.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[#e5e0d6] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#e5e0d6] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        {error && <p className="text-sm text-[var(--color-warn)]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-dark)] transition-colors disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="text-sm text-[#8a8478] mt-4">
        No account? <Link to="/signup" className="text-[var(--color-accent)] font-medium">Sign up</Link>
      </p>

      <div className="mt-8 p-3 rounded-md bg-white border border-[#e5e0d6] text-xs text-[#8a8478]">
        <p className="font-medium mb-1">Demo credentials (pre-filled):</p>
        <p>jane@example.com / password123</p>
        <p>admin@example.com / admin123 (admin)</p>
      </div>
    </div>
  );
}
