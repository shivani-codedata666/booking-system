import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="border-b border-[#e5e0d6] bg-[var(--color-paper)]">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Slotwise
          </span>
          <span className="text-xs uppercase tracking-widest text-[var(--color-accent)]">
            booking
          </span>
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {user ? (
            <>
              <Link to="/" className="hover:text-[var(--color-accent)] transition-colors">
                Resources
              </Link>
              <Link to="/my-bookings" className="hover:text-[var(--color-accent)] transition-colors">
                My Bookings
              </Link>
              <span className="text-[#8a8478]">Hi, {user.name.split(" ")[0]}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md border border-[#e5e0d6] hover:border-[var(--color-warn)] hover:text-[var(--color-warn)] transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-[var(--color-accent)] transition-colors">
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-3 py-1.5 rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)] transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
