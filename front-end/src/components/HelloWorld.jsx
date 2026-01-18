import { useEffect, useState } from "react";

export default function HelloWorld() {
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const res = await fetch("http://127.0.0.1:8000/receipts");
        const data = await res.json();
        setReceipts(data);
      } catch (err) {
        console.error("Error fetching receipts:", err);
      }
    }

    fetchReceipts();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Receipts</h1>

      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Merchant</th>
            <th>Date</th>
            <th>Category</th>
            <th>Total</th>
            <th>Currency</th>
            <th>Items</th>
          </tr>
        </thead>

        <tbody>
          {receipts.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>
                {r.first_name} {r.last_name}
              </td>
              <td>{r.merchant}</td>
              <td>{r.receipt_date}</td>
              <td>{r.category}</td>
              <td>{r.total.toFixed(2)}</td>
              <td>{r.currency}</td>
              <td>
                <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                  {r.items.map((item, i) => (
                    <li key={i}>
                      {item.name} — {item.quantity} × ${item.price}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
