import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Receipt Scanner</h1>
      <p style={{ opacity: 0.8, maxWidth: 520 }}>
        Upload receipts, extract totals automatically, and assign spending
        to people.
      </p>

      <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
        <Link to="/scan">
          <button style={buttonStyle}>Scan a receipt</button>
        </Link>
        <Link to="/results">
          <button style={buttonStyle}>View results</button>
        </Link>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontWeight: 800,
  cursor: "pointer",
  background: "white",
};
