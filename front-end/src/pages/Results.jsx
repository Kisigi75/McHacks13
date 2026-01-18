export default function Results({ result }) {
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
        <h1 style={{ marginTop: 0 }}>Results</h1>

        {!result && (
          <p style={{ opacity: 0.7 }}>
            No results yet. Scan a receipt first.
          </p>
        )}

        {result && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
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
          </>
        )}
      </div>
    </div>
  );
}

