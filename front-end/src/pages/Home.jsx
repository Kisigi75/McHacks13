import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        paddingTop: 40,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Receipt Scanner</h1>

        <p style={{ opacity: 0.8, maxWidth: 520 }}>
          Upload receipts, extract totals automatically, and assign spending
          to people.
        </p>

        <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
          <a href="/scan">
            <button style={buttonStyle}>Scan a receipt</button>
          </a>
          <a href="/results">
            <button style={buttonStyle}>View results</button>
          </a>
        </div>
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
