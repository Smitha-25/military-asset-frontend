
import { useEffect, useState } from "react";

const API = "https://military-asset-backend-pxae.onrender.com";

function Transfers({ authHeader }) {
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [fromBaseId, setFromBaseId] = useState("");
  const [toBaseId, setToBaseId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: authHeader };

  const loadData = async () => {
    const [baseRes, equipmentRes, transferRes] = await Promise.all([
      fetch(`${API}/api/bases`, { headers }),
      fetch(`${API}/api/equipment`, { headers }),
      fetch(`${API}/api/transfers`, { headers }),
    ]);

    if (!baseRes.ok || !equipmentRes.ok || !transferRes.ok) {
      throw new Error("Unable to load transfer data.");
    }

    const [baseData, equipmentData, transferData] = await Promise.all([
      baseRes.json(),
      equipmentRes.json(),
      transferRes.json(),
    ]);

    setBases(baseData);
    setEquipment(equipmentData);
    setTransfers(transferData);
  };

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  const getName = (item) =>
    item?.name ??
    item?.baseName ??
    item?.equipmentName ??
    `ID: ${item?.id}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (fromBaseId === toBaseId) {
      setError("From Base and To Base must be different.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/api/transfers`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromBase: { id: Number(fromBaseId) },
          toBase: { id: Number(toBaseId) },
          equipment: { id: Number(equipmentId) },
          quantity: Number(quantity),
          transferDate: transferDate + ":00",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add transfer.");
      }

      setMessage("Transfer added successfully.");
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
      <h2>Transfers</h2>

      <form className="purchase-form" onSubmit={handleSubmit}>
        <label>From Base</label>
        <select
          value={fromBaseId}
          onChange={(e) => setFromBaseId(e.target.value)}
          required
        >
          <option value="">Select source base</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {getName(base)}
            </option>
          ))}
        </select>

        <label>To Base</label>
        <select
          value={toBaseId}
          onChange={(e) => setToBaseId(e.target.value)}
          required
        >
          <option value="">Select destination base</option>
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

        <label>Transfer Date</label>
        <input
          type="datetime-local"
          value={transferDate}
          onChange={(e) => setTransferDate(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Transfer"}
        </button>
      </form>

      <h2 className="table-heading">Transfer History</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>From Base</th>
              <th>To Base</th>
              <th>Equipment</th>
              <th>Quantity</th>
              <th>Transfer Date</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer) => (
              <tr key={transfer.id}>
                <td>{transfer.id}</td>
                <td>{getName(transfer.fromBase)}</td>
                <td>{getName(transfer.toBase)}</td>
                <td>{getName(transfer.equipment)}</td>
                <td>{transfer.quantity}</td>
                <td>
                  {transfer.transferDate
                    ? transfer.transferDate.replace("T", " ")
                    : "-"}
                </td>
              </tr>
            ))}
            {transfers.length === 0 && (
              <tr>
                <td colSpan="6">No transfers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default Transfers;