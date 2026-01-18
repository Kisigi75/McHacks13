import React, { useEffect, useState } from "react";

const THEME = {
  bg: "#F5F7FF",
  card: "#FFFFFF",
  border: "#E6E8F2",
  text: "#0B1020",
  muted: "#5B647A",
  primary: "#1E40FF",
  primary2: "#1A35D6",
  soft: "#EEF2FF",
};

export default function Results() {
  const [receipts, setReceipts] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currency, setCurrency] = useState("original");
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState(""); // <-- input for person_id

  useEffect(() => {
    async function fetchReceipts() {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/receipts");
        const data = await res.json();
        setReceipts(data);
      } catch (err) {
        console.error("Error fetching receipts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, []);

  const toggleRow = (rId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rId)) newSet.delete(rId);
      else newSet.add(rId);
      return newSet;
    });
  };

  const formatTotal = (r) => {
    if (currency === "cad") return `$${r.total_cad?.toFixed(2) || 0}`;
    return `${r.currency} ${r.total?.toFixed(2) || 0}`;
  };

  const formatItemPrice = (r, item) => {
    if (currency === "cad") {
      const factor = r.total && r.total !== 0 ? r.total_cad / r.total : 1;
      return `$${(item.price * factor).toFixed(2)}`;
    }
    return `${r.currency} ${item.price.toFixed(2)}`;
  };

  // Filter receipts by typed person_id
  const filteredReceipts = searchId
    ? receipts.filter((r) => String(r.person_id) === searchId)
    : receipts;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: `radial-gradient(900px 500px at 20% 0%, rgba(30,64,255,0.10), transparent 55%),
                     radial-gradient(700px 420px at 90% 10%, rgba(30,64,255,0.08), transparent 50%),
                     ${THEME.bg}`,
        color: THEME.text,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 20 }}>Employee Transactions</h1>

        {/* Input for person_id */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontWeight: 700, color: THEME.text }}>Filter by Person ID:</label>
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Employee Id"
            style={{
              padding: "6px 12px",
              borderRadius: 10,
              border: `1px solid ${THEME.border}`,
              fontWeight: 600,
              width: 120,
              outlineColor: THEME.primary,
            }}
          />
        </div>

        {loading ? (
          <p style={{ color: THEME.muted }}>Loading...</p>
        ) : filteredReceipts.length === 0 ? (
          <p style={{ color: THEME.muted }}>
            No receipts found for person ID {searchId || "(all)"}
          </p>
        ) : (
          <div
            style={{
              background: THEME.card,
              border: `1px solid ${THEME.border}`,
              borderRadius: 18,
              boxShadow: "0 12px 30px rgba(20,30,70,0.07)",
              padding: 22,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Merchant</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>
                    Total{" "}
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      style={{
                        marginLeft: 6,
                        borderRadius: 8,
                        border: `1px solid ${THEME.border}`,
                        padding: "2px 6px",
                        fontWeight: 700,
                        color: THEME.text,
                        outlineColor: THEME.primary,
                        cursor: "pointer",
                      }}
                    >
                      <option value="original">Original</option>
                      <option value="cad">CAD</option>
                    </select>
                  </th>
                  <th style={thStyle}>Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr
                      style={{
                        backgroundColor: expandedRows.has(r.id) ? THEME.soft : "white",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onClick={() => toggleRow(r.id)}
                    >
                      <td style={tdStyle}>
                        {r.first_name} {r.last_name}
                      </td>
                      <td style={tdStyle}>{r.merchant}</td>
                      <td style={tdStyle}>{r.receipt_date || "-"}</td>
                      <td style={tdStyle}>{r.category}</td>
                      <td style={tdStyle}>{formatTotal(r)}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        {expandedRows.has(r.id) ? "▼" : "►"}
                      </td>
                    </tr>

                    {expandedRows.has(r.id) && (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr>
                                <th style={subThStyle}>Item Name</th>
                                <th style={subThStyle}>Quantity</th>
                                <th style={subThStyle}>Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.items.map((item, i) => (
                                <tr key={i}>
                                  <td style={subTdStyle}>{item.name}</td>
                                  <td style={subTdStyle}>{item.quantity}</td>
                                  <td style={subTdStyle}>{formatItemPrice(r, item)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 700,
  borderBottom: `1px solid ${THEME.border}`,
  color: THEME.text,
};

const tdStyle = {
  padding: "10px 12px",
  borderBottom: `1px solid ${THEME.border}`,
  color: THEME.text,
};

const subThStyle = {
  textAlign: "left",
  padding: "8px 10px",
  fontWeight: 700,
  borderBottom: `1px solid ${THEME.border}`,
  background: THEME.soft,
  color: THEME.primary2,
};

const subTdStyle = {
  padding: "8px 10px",
  borderBottom: `1px solid ${THEME.border}`,
  color: THEME.text,
};
