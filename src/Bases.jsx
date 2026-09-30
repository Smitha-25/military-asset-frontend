
import { useEffect, useState } from "react";

function Bases({ authHeader }) {
  const [bases, setBases] = useState([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API = "https://military-asset-backend-pxae.onrender.com/api/bases";

  const fetchBases = async () => {
    try {
      const response = await fetch(API, {
        headers: { Authorization: authHeader },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bases");
      }

      const data = await response.json();
      setBases(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchBases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !location.trim()) {
      setError("Please enter both name and location.");
      return;
    }

    const base = {
      name: name.trim(),
      location: location.trim(),
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
          body: JSON.stringify(base),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save base.");
      }

      setSuccess(
        editingId
          ? "Base updated successfully."
          : "Base added successfully."
      );

      setName("");
      setLocation("");
      setEditingId(null);
      await fetchBases();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (base) => {
    setEditingId(base.id);
    setName(base.name);
    setLocation(base.location);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setLocation("");
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this base?")) {
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
          "Failed to delete base. It may be referenced by other records."
        );
      }

      setSuccess("Base deleted successfully.");
      await fetchBases();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Bases Management</h2>

      <form className="purchase-form" onSubmit={handleSubmit}>
        <h3>{editingId ? "Update Base" : "Add New Base"}</h3>

        <input
          type="text"
          placeholder="Base Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <button type="submit">
          {editingId ? "Update Base" : "Add Base"}
        </button>

        {editingId && (
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <h3>All Bases</h3>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Base Name</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {bases.length === 0 ? (
              <tr>
                <td colSpan="4">No bases found.</td>
              </tr>
            ) : (
              bases.map((base) => (
                <tr key={base.id}>
                  <td>{base.id}</td>
                  <td>{base.name}</td>
                  <td>{base.location}</td>
                  <td>
                    <button onClick={() => handleEdit(base)}>
                      Edit
                    </button>{" "}
                    <button onClick={() => handleDelete(base.id)}>
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

export default Bases;