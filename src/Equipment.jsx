
import { useEffect, useState } from "react";

function Equipment({ authHeader }) {
  const [equipment, setEquipment] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API = "http://localhost:9090/api/equipment";

  const fetchEquipment = async () => {
    try {
      const response = await fetch(API, {
        headers: { Authorization: authHeader },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch equipment.");
      }

      const data = await response.json();
      setEquipment(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !type.trim()) {
      setError("Please enter both equipment name and type.");
      return;
    }

    const item = {
      name: name.trim(),
      type: type.trim(),
      description: description.trim(),
    };

    try {
      const response = await fetch(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(item),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save equipment.");
      }

      setSuccess(
        editingId
          ? "Equipment updated successfully."
          : "Equipment added successfully."
      );

      setName("");
      setType("");
      setDescription("");
      setEditingId(null);

      await fetchEquipment();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setType(item.type);
    setDescription(item.description || "");
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setType("");
    setDescription("");
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this equipment?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });

      if (!response.ok) {
        throw new Error(
          "Failed to delete equipment. It may be referenced by other records."
        );
      }

      setSuccess("Equipment deleted successfully.");
      await fetchEquipment();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Equipment Management</h2>

      <form className="purchase-form" onSubmit={handleSubmit}>
        <h3>{editingId ? "Update Equipment" : "Add New Equipment"}</h3>

        <input
          type="text"
          placeholder="Equipment Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Equipment Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
        />

        <button type="submit">
          {editingId ? "Update Equipment" : "Add Equipment"}
        </button>

        {editingId && (
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <h3>All Equipment</h3>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {equipment.length === 0 ? (
              <tr>
                <td colSpan="5">No equipment found.</td>
              </tr>
            ) : (
              equipment.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.description || "-"}</td>
                  <td>
                    <button onClick={() => handleEdit(item)}>
                      Edit
                    </button>{" "}
                    <button onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Equipment;