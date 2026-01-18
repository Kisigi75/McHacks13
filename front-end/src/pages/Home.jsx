
import { Link } from "react-router-dom";
import stockPhoto1 from "../assets/stock_photo1.png";
import stockPhoto2 from "../assets/stock_photo2.png";

const THEME = {
  bg: "#F5F7FF",
  card: "#FFFFFF",
  border: "#E6E8F2",
  text: "#0B1020",
  muted: "#5B647A",
  primary: "#1E40FF",
  primary2: "#1A35D6",
};

export default function Home() {
  const btnPrimary = {
    height: 48,
    padding: "0 22px",
    borderRadius: 14,
    border: "1px solid rgba(30,64,255,0.35)",
    background: `linear-gradient(180deg, ${THEME.primary}, ${THEME.primary2})`,
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(30,64,255,0.22)",
  };

  const btnGhost = {
    height: 48,
    padding: "0 22px",
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "white",
    fontWeight: 800,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 32,
        background: `
          radial-gradient(900px 500px at 20% 0%, rgba(30,64,255,0.10), transparent 55%),
          radial-gradient(700px 420px at 90% 10%, rgba(30,64,255,0.08), transparent 50%),
          ${THEME.bg}
        `,
        color: THEME.text,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          alignItems: "center",
          gap: 60,
          paddingTop: 60,
        }}
      >
        {/* LEFT — TEXT */}
        <div>
          {/* Logo block */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: `linear-gradient(180deg, ${THEME.primary}, ${THEME.primary2})`,
              boxShadow: "0 14px 26px rgba(30,64,255,0.28)",
              marginBottom: 22,
            }}
          />

          {/* Title */}
          <h1
            style={{
              margin: 0,
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: -1.8,
              color: THEME.primary,
            }}
          >
            SpendScope
          </h1>

          {/* Description */}
          <p
            style={{
              marginTop: 18,
              fontSize: 18,
              color: THEME.muted,
              maxWidth: 520,
              lineHeight: 1.6,
            }}
          >
            Scan receipts, track expenses, and understand your spending
            patterns in seconds — all in one clean, intuitive dashboard.
          </p>

          {/* Buttons */}
          <div
            style={{
              marginTop: 34,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <Link to="/scan">
              <button style={btnPrimary}>Scan a receipt</button>
            </Link>

            <Link to="/results">
              <button style={btnGhost}>View results</button>
            </Link>
          </div>
        </div>

        {/* RIGHT — IMAGES */}
        <div style={{ position: "relative" }}>
          {/* Main image (person doing expenses) */}
          <img
            src={stockPhoto1}
            alt="Expense reporting"
            style={{
              width: "110%",
              borderRadius: 24,
              border: `1px solid ${THEME.border}`,
              boxShadow: "0 28px 56px rgba(20,30,70,0.20)",
              transform: "translateX(5%)",

            }}
          />

          {/* Accent image (receipt) */}
          <img
            src={stockPhoto2}
            alt="Receipt example"
            style={{
              position: "absolute",
              bottom: -30,
              right: -250,
              width: "55%",
              borderRadius: 20,
              border: `1px solid ${THEME.border}`,
              boxShadow: "0 20px 40px rgba(20,30,70,0.18)",
              background: "white",
            }}
          />
        </div>
      </div>
    </div>
  );
}
