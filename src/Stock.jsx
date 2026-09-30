
import { useEffect, useState } from "react";

const API = "https://military-asset-backend-pxae.onrender.com";

function Stock({ authHeader }) {
  const [stock, setStock] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStock = async () => {
      try {
        const response = await fetch(`${API}/api/stock`, {
          headers: { Authorization: authHeader },
        });

        if (!response.ok) {
          throw new Error("Unable to load stock data.");
        }

        const data = await response.json();
        setStock(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [authHeader]);

  const getName = (item) =>
    item?.name ??
    item?.baseName ??
    item?.equipmentName ??
    `ID: ${item?.id}`;

  return (
    <main className="dashboard">
      <h2>Stock Management</h2>

      {loading && <p>Loading stock...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Base</th>
                  <th>Equipment</th>
                  <th>Available Quantity</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{getName(item.base)}</td>
                    <td>{getName(item.equipment)}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
                {stock.length === 0 && (
                  <tr>
                    <td colSpan="4">No stock records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

export default Stock;