
import { useEffect, useState } from "react";

const API = "http://localhost:9090";

function Purchases({ authHeader }) {
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [baseId, setBaseId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: authHeader };

  const loadData = async () => {
    const [baseRes, equipmentRes, purchaseRes] = await Promise.all([
      fetch(`${API}/api/bases`, { headers }),
      fetch(`${API}/api/equipment`, { headers }),
      fetch(`${API}/api/purchases`, { headers }),
    ]);

    if (!baseRes.ok || !equipmentRes.ok || !purchaseRes.ok) {
      throw new Error("Unable to load purchase data.");
    }

    const [baseData, equipmentData, purchaseData] = await Promise.all([
      baseRes.json(),
      equipmentRes.json(),
      purchaseRes.json(),
    ]);

    setBases(baseData);
    setEquipment(equipmentData);
    setPurchases(purchaseData);
  };

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  const getName = (item) =>
    item?.name ?? item?.baseName ?? item?.equipmentName ?? `ID: ${item?.id}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/purchases`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base: { id: Number(baseId) },
          equipment: { id: Number(equipmentId) },
          quantity: Number(quantity),
          purchaseDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add purchase.");
      }

      setMessage("Purchase added successfully.");
      setQuantity("");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard">
      <h2>Purchases</h2>

      <form className="purchase-form" onSubmit={handleSubmit}>
        <label>Base</label>
        <select
          value={baseId}
          onChange={(e) => setBaseId(e.target.value)}
          required
        >
          <option value="">Select base</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {getName(base)}
            </option>
          ))}
        </select>

        <label>Equipment</label>
        <select
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
          required
        >
          <option value="">Select equipment</option>
          {equipment.map((item) => (
            <option key={item.id} value={item.id}>
              {getName(item)}
            </option>
          ))}
        </select>

        <label>Quantity</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
          required
        />

        <label>Purchase Date</label>
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Purchase"}
        </button>
      </form>

      <h2 className="table-heading">Purchase History</h2>
      {error && purchases.length === 0 && (
        <p className="error">{error}</p>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Base</th>
              <th>Equipment</th>
              <th>Quantity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>{purchase.id}</td>
                <td>{getName(purchase.base)}</td>
                <td>{getName(purchase.equipment)}</td>
                <td>{purchase.quantity}</td>
                <td>{purchase.purchaseDate}</td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan="5">No purchases found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default Purchases;