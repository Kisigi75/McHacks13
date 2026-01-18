import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: 20,
        padding: "16px 24px",
        borderBottom: "1px solid #e5e7eb",
        background: "white",
      }}
    >
      <NavLink to="/" style={linkStyle}>
        Home
      </NavLink>
      <NavLink to="/scan" style={linkStyle}>
        Upload
      </NavLink>
      <NavLink to="/results" style={linkStyle}>
        Results
      </NavLink>
    </nav>
  );
}

function linkStyle({ isActive }) {
  return {
    fontWeight: 800,
    textDecoration: "none",
    color: isActive ? "#111827" : "#6b7280",
  };
}
