
import { useEffect, useState } from "react";

const API = "http://localhost:9090";

function Assignments({ authHeader }) {
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [baseId, setBaseId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [assignmentDate, setAssignmentDate] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: authHeader };

  const loadData = async () => {
    const [baseRes, equipmentRes, assignmentRes] = await Promise.all([
      fetch(`${API}/api/bases`, { headers }),
      fetch(`${API}/api/equipment`, { headers }),
      fetch(`${API}/api/assignments`, { headers }),
    ]);

    if (!baseRes.ok || !equipmentRes.ok || !assignmentRes.ok) {
      throw new Error("Unable to load assignment data.");
    }

    const [baseData, equipmentData, assignmentData] = await Promise.all([
      baseRes.json(),
      equipmentRes.json(),
      assignmentRes.json(),
    ]);

    setBases(baseData);
    setEquipment(equipmentData);
    setAssignments(assignmentData);
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
      const response = await fetch(`${API}/api/assignments`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base: { id: Number(baseId) },
          equipment: { id: Number(equipmentId) },
          quantity: Number(quantity),
          assignmentDate: assignmentDate + ":00",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add assignment.");
      }

      setMessage("Assignment added successfully.");
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
      <h2>Assignments</h2>

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

        <label>Assignment Date</label>
        <input
          type="datetime-local"
          value={assignmentDate}
          onChange={(e) => setAssignmentDate(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Assign Equipment"}
        </button>
      </form>

      <h2 className="table-heading">Assignment History</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Base</th>
              <th>Equipment</th>
              <th>Quantity</th>
              <th>Assignment Date</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.id}</td>
                <td>{getName(assignment.base)}</td>
                <td>{getName(assignment.equipment)}</td>
                <td>{assignment.quantity}</td>
                <td>
                  {assignment.assignmentDate
                    ? assignment.assignmentDate.replace("T", " ")
                    : "-"}
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan="5">No assignments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default Assignments;