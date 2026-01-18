import { useEffect, useRef, useState } from "react";

export default function Scan() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [person, setPerson] = useState("Rowan");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // hackathon “AI working” feel
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // Clean up blob URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function setNewFile(f) {
    setResult(null);
    setError("");

    // revoke old preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(f);

    if (!f) {
      setPreviewUrl("");
      return;
    }

    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl("");
    }
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    if (!f) return setNewFile(null);

    // quick hackathon guardrails
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

    const csv = rows.map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipt-result.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Demo-mode button (great for judges if lighting/photo fails)
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

    // “progress” animation for demo feel
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(95, p + Math.floor(Math.random() * 12) + 3);
      setProgress(p);
    }, 250);

    try {
      // Backend-ready payload (swap stub for real fetch when ready)
      const form = new FormData();
      form.append("receipt", file);
      form.append("person", person);

      // ✅ When backend exists, replace stub with:
      // const res = await fetch("http://localhost:5000/scan", { method: "POST", body: form });
      // if (!res.ok) throw new Error(await res.text());
      // const data = await res.json();

      // Demo stub
      await new Promise((r) => setTimeout(r, 1400));
      const data = {
        person,
        total: "$42.13",
        merchant: file.type === "application/pdf" ? "PDF Receipt" : "Starbucks",
        date: "2026-01-17",
        confidence: 0.92,
        flags: ["Tip detected"],
        items: [
          { name: "Latte", price: "$6.45" },
          { name: "Sandwich", price: "$10.99" },
          { name: "Tip", price: "$3.00" },
        ],
      };

      setResult(data);
      setProgress(100);
    } catch (e) {
      setError("Scan failed. Try a clearer photo or use Demo Result.");
    } finally {
      clearInterval(t);
      setLoading(false);
    }
  }

  // Drag & drop support (hackathon wow)
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

  const fileLabel = file ? `${file.name} (${Math.ceil(file.size / 1024)} KB)` : "Drag & drop an image/PDF here or click to upload";

  return (
    <div style={{ minHeight: "100vh", padding: 24, background: "#f8fafc" }}>
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
          <h1 style={{ margin: "0 0 16px" }}>Scan Receipt</h1>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            {new Date().toLocaleString()} {/* makes demo feel “live” */}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* LEFT: Upload + Preview */}
          <div style={{ padding: 20, borderRadius: 16, border: "1px solid #e5e7eb", background: "white" }}>
            <h2 style={{ marginTop: 0 }}>Upload</h2>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <label style={{ fontWeight: 800 }}>Person</label>
              <select
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              >
                <option>Rowan</option>
                <option>Dimana</option>
                <option>Alex</option>
                <option>Other</option>
              </select>

              <button
                onClick={openFilePicker}
                style={{
                  marginLeft: "auto",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontWeight: 800,
                  cursor: "pointer",
                  background: "white",
                }}
              >
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

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={openFilePicker}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? openFilePicker() : null)}
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 14,
                border: "1px dashed #cbd5e1",
                background: "#f8fafc",
                cursor: "pointer",
                userSelect: "none",
              }}
              title="Drop a file here"
            >
              <div style={{ fontWeight: 800 }}>Upload receipt</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>{fileLabel}</div>
            </div>

            {previewUrl && (
              <img
                src={previewUrl}
                alt="Receipt preview"
                style={{
                  marginTop: 14,
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            )}

            {file && !previewUrl && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                <b>Selected:</b> {file.name} <span style={{ opacity: 0.7 }}>(Preview available for images)</span>
              </div>
            )}

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={handleScan}
                disabled={!file || loading}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontWeight: 900,
                  cursor: !file || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Scanning…" : "Scan"}
              </button>

              <button
                onClick={() => reset(true)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "white",
                }}
              >
                Reset
              </button>

              <button
                onClick={loadDemoResult}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "white",
                }}
              >
                Demo Result
              </button>
            </div>

            {loading && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.8 }}>
                  <span>Extracting fields…</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ marginTop: 8, height: 10, borderRadius: 999, border: "1px solid #e5e7eb" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      borderRadius: 999,
                      background: "#111827",
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
                  borderRadius: 12,
                  border: "1px solid #fecaca",
                  background: "#fff1f2",
                }}
              >
                <b>Oops:</b> {error}
                <button
                  onClick={() => setError("")}
                  style={{
                    marginLeft: 10,
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #fecaca",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Results */}
          <div style={{ padding: 20, borderRadius: 16, border: "1px solid #e5e7eb", background: "white" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={{ marginTop: 0 }}>Results</h2>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={downloadJSON}
                  disabled={!result}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontWeight: 700,
                    cursor: result ? "pointer" : "not-allowed",
                    background: "white",
                  }}
                >
                  Download JSON
                </button>

                <button
                  onClick={downloadCSV}
                  disabled={!result}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontWeight: 700,
                    cursor: result ? "pointer" : "not-allowed",
                    background: "white",
                  }}
                >
                  Download CSV
                </button>
              </div>
            </div>

            {!result && !loading && (
              <div style={{ opacity: 0.75 }}>
                <p style={{ marginTop: 0 }}>
                  Upload a receipt and click <b>Scan</b>.
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <b>Person</b>
                    <div>{result.person}</div>
                  </div>
                  <div>
                    <b>Total</b>
                    <div>{result.total}</div>
                  </div>
                  <div>
                    <b>Merchant</b>
                    <div>{result.merchant}</div>
                  </div>
                  <div>
                    <b>Date</b>
                    <div>{result.date}</div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <b>Confidence</b>
                  <div>{Math.round((result.confidence ?? 0) * 100)}%</div>
                </div>

                {result.flags?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <b>Flags</b>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                      {result.flags.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.items?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <b>Line items (demo)</b>
                    <div style={{ marginTop: 8, border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", padding: 10, fontWeight: 800, background: "#f8fafc" }}>
                        <div>Item</div>
                        <div style={{ textAlign: "right" }}>Price</div>
                      </div>
                      {result.items.map((it, idx) => (
                        <div
                          key={`${it.name}-${idx}`}
                          style={{ display: "grid", gridTemplateColumns: "1fr 120px", padding: 10, borderTop: "1px solid #e5e7eb" }}
                        >
                          <div>{it.name}</div>
                          <div style={{ textAlign: "right" }}>{it.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <p style={{ marginTop: 14, opacity: 0.6 }}>
        </p>
      </div>
    </div>
  );
}
