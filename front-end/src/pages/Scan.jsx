import { useEffect, useRef, useState } from "react";

const THEME = {
  bg: "#F5F7FF",
  card: "#FFFFFF",
  border: "#E6E8F2",
  text: "#0B1020",
  muted: "#5B647A",
  primary: "#1E40FF",     // royal blue
  primary2: "#1A35D6",
  soft: "#EEF2FF",
  dangerBg: "#FFF1F2",
  dangerBorder: "#FECACA",
};

export default function Scan() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [person, setPerson] = useState("Rowan");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function setNewFile(f) {
    setResult(null);
    setError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(f);

    if (!f) {
      setPreviewUrl("");
      return;
    }

    if (f.type.startsWith("image/")) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl("");
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    if (!f) return setNewFile(null);

    const maxMB = 12;
    if (f.size > maxMB * 1024 * 1024) {
      setError(`File too large. Please upload under ${maxMB}MB.`);
      setNewFile(null);
      return;
    }
    setNewFile(f);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function reset(keepPerson = true) {
    setNewFile(null);
    setResult(null);
    setError("");
    setLoading(false);
    setProgress(0);
    if (!keepPerson) setPerson("Rowan");
  }

  function downloadJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipt-result.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    if (!result) return;

    const rows = [
      ["person", result.person ?? ""],
      ["total", result.total ?? ""],
      ["merchant", result.merchant ?? ""],
      ["date", result.date ?? ""],
      ["confidence", String(result.confidence ?? "")],
      ["flags", (result.flags ?? []).join(" | ")],
    ];

    const items = result.items ?? [];
    if (items.length) {
      rows.push(["", ""]);
      rows.push(["items", ""]);
      rows.push(["name", "price"]);
      for (const it of items) rows.push([it.name ?? "", it.price ?? ""]);
    }

    const csv = rows
      .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipt-result.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadDemoResult() {
    setResult({
      person,
      total: "$42.13",
      merchant: "Starbucks",
      date: "2026-01-17",
      confidence: 0.92,
      flags: ["Tip detected"],
      items: [
        { name: "Latte", price: "$6.45" },
        { name: "Sandwich", price: "$10.99" },
        { name: "Tip", price: "$3.00" },
      ],
    });
    setError("");
  }

  async function handleScan() {
    if (!file) {
      setError("Choose a receipt first (or use Demo Result).");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setProgress(0);

    let p = 0;
    const t = setInterval(() => {
      p = Math.min(95, p + Math.floor(Math.random() * 12) + 3);
      setProgress(p);
    }, 250);

    try {
      const form = new FormData();
      form.append("receipt", file);
      form.append("person_id", "6");
      form.append("category", person);

      const res = await fetch("http://127.0.0.1:8005/scan", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      setResult(data);
      setProgress(100);
    } catch (e) {
      setError("Scan failed. Try a clearer photo or use Demo Result.");
    } finally {
      clearInterval(t);
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) setNewFile(f);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const fileLabel = file
    ? `${file.name} (${Math.ceil(file.size / 1024)} KB)`
    : "Drag & drop an image/PDF here or click to upload";

  // small reusable style helpers (no extra libs)
  const cardStyle = {
    padding: 22,
    borderRadius: 18,
    border: `1px solid ${THEME.border}`,
    background: THEME.card,
    boxShadow: "0 12px 30px rgba(20, 30, 70, 0.07)",
  };

  const btnBase = {
    height: 44,
    padding: "0 14px",
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
    userSelect: "none",
  };

  const btnPrimary = {
    ...btnBase,
    border: "1px solid rgba(30,64,255,0.35)",
    background: `linear-gradient(180deg, ${THEME.primary}, ${THEME.primary2})`,
    color: "white",
    boxShadow: "0 10px 18px rgba(30,64,255,0.22)",
  };

  const btnGhost = {
    ...btnBase,
    background: "white",
    color: THEME.text,
  };

  const btnSoft = {
    ...btnBase,
    background: THEME.soft,
    color: THEME.primary2,
    border: "1px solid rgba(30,64,255,0.18)",
  };

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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: `linear-gradient(180deg, ${THEME.primary}, ${THEME.primary2})`,
                  boxShadow: "0 10px 18px rgba(30,64,255,0.25)",
                }}
              />
              <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.4 }}>Scan Receipt</h1>
            </div>
            <div style={{ marginTop: 6, color: THEME.muted, fontSize: 13 }}>
              Upload → extract total/merchant/date → export JSON/CSV
            </div>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              border: `1px solid ${THEME.border}`,
              background: "rgba(255,255,255,0.8)",
              color: THEME.muted,
              fontSize: 13,
              backdropFilter: "blur(6px)",
            }}
            title="Live timestamp"
          >
            {new Date().toLocaleString()}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* LEFT */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Upload</h2>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: THEME.muted, fontWeight: 700 }}>Person</span>
                <select
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  style={{
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 12,
                    border: `1px solid ${THEME.border}`,
                    background: "white",
                    fontWeight: 700,
                    color: THEME.text,
                    outlineColor: THEME.primary,
                  }}
                >
                  <option>Rowan</option>
                  <option>Dimana</option>
                  <option>Alex</option>
                  <option>Other</option>
                </select>

                <button onClick={openFilePicker} style={btnSoft}>
                  Choose file
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={openFilePicker}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? openFilePicker() : null)}
              style={{
                marginTop: 10,
                padding: 16,
                borderRadius: 16,
                border: `1px dashed rgba(30,64,255,0.35)`,
                background: "linear-gradient(180deg, rgba(30,64,255,0.06), rgba(255,255,255,0))",
                cursor: "pointer",
                userSelect: "none",
              }}
              title="Drop a file here"
            >
              <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>Upload receipt</div>
              <div style={{ marginTop: 6, color: THEME.muted, fontSize: 13 }}>{fileLabel}</div>
            </div>

            {/* Preview */}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Receipt preview"
                style={{
                  marginTop: 14,
                  width: "100%",
                  borderRadius: 16,
                  border: `1px solid ${THEME.border}`,
                  boxShadow: "0 12px 22px rgba(15, 25, 60, 0.06)",
                }}
              />
            )}

            {file && !previewUrl && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  border: `1px solid ${THEME.border}`,
                  background: "white",
                  color: THEME.muted,
                  fontSize: 13,
                }}
              >
                <b style={{ color: THEME.text }}>Selected:</b> {file.name}{" "}
                <span style={{ opacity: 0.8 }}>(Preview available for images)</span>
              </div>
            )}

            {/* ACTION ROW (aligned + pretty) */}
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={handleScan}
                disabled={!file || loading}
                style={{
                  ...btnPrimary,
                  opacity: !file || loading ? 0.55 : 1,
                  cursor: !file || loading ? "not-allowed" : "pointer",
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "translateY(1px)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "translateY(0px)"}
              >
                {loading ? "Scanning…" : "Scan"}
              </button>

              <button onClick={() => reset(true)} style={btnGhost}>
                Reset
              </button>

              <button onClick={loadDemoResult} style={btnGhost}>
                Demo Result
              </button>
            </div>

            {loading && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: THEME.muted }}>
                  <span>Extracting fields…</span>
                  <span style={{ fontWeight: 800, color: THEME.primary2 }}>{progress}%</span>
                </div>
                <div style={{ marginTop: 8, height: 10, borderRadius: 999, border: `1px solid ${THEME.border}`, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${THEME.primary}, ${THEME.primary2})`,
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 14,
                  border: `1px solid ${THEME.dangerBorder}`,
                  background: THEME.dangerBg,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 13 }}>
                  <b>Oops:</b> {error}
                </div>
                <button
                  onClick={() => setError("")}
                  style={{
                    ...btnBase,
                    height: 34,
                    padding: "0 10px",
                    borderRadius: 12,
                    border: `1px solid ${THEME.dangerBorder}`,
                    background: "white",
                    fontWeight: 800,
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Results</h2>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={downloadJSON}
                  disabled={!result}
                  style={{
                    ...btnGhost,
                    height: 40,
                    opacity: result ? 1 : 0.5,
                    cursor: result ? "pointer" : "not-allowed",
                  }}
                >
                  Download JSON
                </button>

                <button
                  onClick={downloadCSV}
                  disabled={!result}
                  style={{
                    ...btnGhost,
                    height: 40,
                    opacity: result ? 1 : 0.5,
                    cursor: result ? "pointer" : "not-allowed",
                  }}
                >
                  Download CSV
                </button>
              </div>
            </div>

            {!result && !loading && (
              <div style={{ marginTop: 12, color: THEME.muted, fontSize: 14 }}>
                <p style={{ marginTop: 0 }}>
                  Upload a receipt and click <b style={{ color: THEME.text }}>Scan</b>.
                </p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Auto-extract merchant, date, and total</li>
                  <li>Assign spending to a person</li>
                  <li>Export results (JSON/CSV)</li>
                </ul>
              </div>
            )}

            {result && (
              <>
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 16,
                    border: `1px solid rgba(30,64,255,0.18)`,
                    background: "linear-gradient(180deg, rgba(30,64,255,0.06), rgba(255,255,255,0))",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Person" value={result.person} />
                    <Field label="Total" value={result.total} />
                    <Field label="Merchant" value={result.merchant} />
                    <Field label="Date" value={result.date} />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 800 }}>Confidence</div>
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>
                        {Math.round((result.confidence ?? 0) * 100)}%
                      </div>
                      <div style={{ flex: 1, height: 10, borderRadius: 999, border: `1px solid ${THEME.border}`, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.round((result.confidence ?? 0) * 100)}%`,
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${THEME.primary}, ${THEME.primary2})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {result.flags?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 900, marginBottom: 8 }}>Flags</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {result.flags.map((f) => (
                        <li key={f} style={{ marginBottom: 6 }}>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.items?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 900 }}>Line items (demo)</div>

                    <div style={{ marginTop: 10, border: `1px solid ${THEME.border}`, borderRadius: 16, overflow: "hidden" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 120px",
                          padding: 12,
                          fontWeight: 900,
                          background: THEME.soft,
                          color: THEME.primary2,
                        }}
                      >
                        <div>Item</div>
                        <div style={{ textAlign: "right" }}>Price</div>
                      </div>

                      {result.items.map((it, idx) => (
                        <div
                          key={`${it.name}-${idx}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 120px",
                            padding: 12,
                            borderTop: `1px solid ${THEME.border}`,
                          }}
                        >
                          <div style={{ color: THEME.text }}>{it.name}</div>
                          <div style={{ textAlign: "right", fontWeight: 800 }}>{it.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <p style={{ marginTop: 14, opacity: 0.55, fontSize: 12, color: THEME.muted }}>
          {/* optional footer */}
        </p>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#5B647A", fontWeight: 900 }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 800 }}>{value ?? ""}</div>
    </div>
  );
}
