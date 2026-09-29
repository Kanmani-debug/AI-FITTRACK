import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p className="page-header__subtitle">Your account information.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <span className="sidebar__avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
            {(user?.name || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <h2>{user?.name}</h2>
            <p className="page-header__subtitle" style={{ marginTop: 2 }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "var(--ink-soft)" }}>User ID</span>
            <span className="numeral">{user?.id}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "var(--ink-soft)" }}>Member since</span>
            <span>{user?.createdAt ? formatDate(user.createdAt) : "—"}</span>
          </div>
        </div>

        <button className="btn btn--danger" style={{ marginTop: 24 }} onClick={handleLogout}>
          Log out
        </button>
      </div>
    </Layout>
  );
}
