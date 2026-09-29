import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "grid" },
  { to: "/workouts", label: "Workout log", icon: "list" },
  { to: "/workouts/new", label: "Add workout", icon: "plus" },
  { to: "/recommendation", label: "AI recommendation", icon: "spark" },
  { to: "/insights", label: "AI insights", icon: "bulb" },
  { to: "/profile", label: "Profile", icon: "user" },
];

const ICONS = {
  grid: (
    <svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  list: (
    <svg viewBox="0 0 20 20" fill="none"><circle cx="4" cy="5" r="1.2" fill="currentColor"/><circle cx="4" cy="10" r="1.2" fill="currentColor"/><circle cx="4" cy="15" r="1.2" fill="currentColor"/><path d="M8 5H17M8 10H17M8 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  plus: (
    <svg viewBox="0 0 20 20" fill="none"><path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
  ),
  spark: (
    <svg viewBox="0 0 20 20" fill="none"><path d="M10 2L11.8 7.6L17.5 9.5L11.8 11.4L10 17L8.2 11.4L2.5 9.5L8.2 7.6L10 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
  ),
  bulb: (
    <svg viewBox="0 0 20 20" fill="none"><path d="M7 15.5H13M8 18H12M6 8.5C6 5.5 8 3.5 10 3.5C12 3.5 14 5.5 14 8.5C14 10.5 12.8 11.5 12 12.5C11.5 13.1 11.3 13.5 11.3 14.5H8.7C8.7 13.5 8.5 13.1 8 12.5C7.2 11.5 6 10.5 6 8.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
  ),
  user: (
    <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.5"/><path d="M3.5 17C4.3 13.5 6.9 11.8 10 11.8C13.1 11.8 15.7 13.5 16.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark">FT</span>
          <span className="sidebar__brand-name">AI FitTrack</span>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `sidebar__link ${isActive ? "is-active" : ""}`}
            >
              <span className="sidebar__icon">{ICONS[item.icon]}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="sidebar__avatar">{(user?.name || "?").charAt(0).toUpperCase()}</span>
            <div>
              <div className="sidebar__user-name">{user?.name}</div>
              <div className="sidebar__user-email">{user?.email}</div>
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--block" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}
