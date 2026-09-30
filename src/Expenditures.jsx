
import { useEffect, useState } from "react";

const API = "http://https://military-asset-backend-pxae.onrender.com";

function Expenditures({ authHeader }) {
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [baseId, setBaseId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expenditureDate, setExpenditureDate] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: authHeader };

  const loadData = async () => {
    const [baseRes, equipmentRes, expenditureRes] = await Promise.all([
      fetch(`${API}/api/bases`, { headers }),
      fetch(`${API}/api/equipment`, { headers }),
      fetch(`${API}/api/expenditures`, { headers }),
    ]);

    if (!baseRes.ok || !equipmentRes.ok || !expenditureRes.ok) {
      throw new Error("Unable to load expenditure data.");
    }

    const [baseData, equipmentData, expenditureData] = await Promise.all([
      baseRes.json(),
      equipmentRes.json(),
      expenditureRes.json(),
    ]);

    setBases(baseData);
    setEquipment(equipmentData);
    setExpenditures(expenditureData);
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
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/expenditures`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base: { id: Number(baseId) },
          equipment: { id: Number(equipmentId) },
          quantity: Number(quantity),
          expenditureDate: expenditureDate + ":00",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add expenditure.");
      }

      setMessage("Expenditure added successfully.");
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
      <h2>Expenditures</h2>

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

        <label>Expenditure Date</label>
        <input
          type="datetime-local"
          value={expenditureDate}
          onChange={(e) => setExpenditureDate(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Expenditure"}
        </button>
      </form>

      <h2 className="table-heading">Expenditure History</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Base</th>
              <th>Equipment</th>
              <th>Quantity</th>
              <th>Expenditure Date</th>
            </tr>
          </thead>
          <tbody>
            {expenditures.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{getName(item.base)}</td>
                <td>{getName(item.equipment)}</td>
                <td>{item.quantity}</td>
                <td>
                  {item.expenditureDate
                    ? item.expenditureDate.replace("T", " ")
                    : "-"}
                </td>
              </tr>
            ))}
            {expenditures.length === 0 && (
              <tr>
                <td colSpan="5">No expenditures found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default Expenditures;