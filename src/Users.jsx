
import { useEffect, useState } from "react";

function Users({ authHeader }) {
  const [users, setUsers] = useState([]);
  const [bases, setBases] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BASE_COMMANDER");
  const [baseId, setBaseId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API = "https://military-asset-backend-pxae.onrender.com";

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API}/api/users`, {
        headers: { Authorization: authHeader },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users.");
      }

      setUsers(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchBases = async () => {
    try {
      const response = await fetch(`${API}/api/bases`, {
        headers: { Authorization: authHeader },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bases.");
      }

      setBases(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBases();
  }, [authHeader]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("BASE_COMMANDER");
    setBaseId("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim()) {
      setError("Please enter the name and email.");
      return;
    }

    const isCreating = editingId === null;

    if (isCreating && !password.trim()) {
      setError("Password is required for a new user.");
      return;
    }

    const userData = {
      name: name.trim(),
      email: email.trim(),
      role: role,
      base: baseId ? { id: Number(baseId) } : null,
    };

    // Always include the password when creating a user.
    if (isCreating) {
      userData.password = password.trim();
    } else if (password.trim()) {
      // Include a password only when changing it during an update.
      userData.password = password.trim();
    }

    try {
      const response = await fetch(
        isCreating
          ? `${API}/api/users`
          : `${API}/api/users/${editingId}`,
        {
          method: isCreating ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        let message = "Failed to save user.";

        try {
          const result = await response.json();
          message = result.message || result.error || message;
        } catch {
          // Keep the default error message if the response isn't JSON.
        }

        throw new Error(message);
      }

      setSuccess(
        isCreating
          ? "User added successfully."
          : "User updated successfully."
      );

      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setName(user.name || "");
    setEmail(user.email || "");
    setPassword("");
    setRole(user.role || "BASE_COMMANDER");
    setBaseId(user.base?.id ? String(user.base.id) : "");
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });

      if (!response.ok) {
        let message = "Failed to delete user.";

        try {
          const result = await response.json();
          message = result.message || result.error || message;
        } catch {
          // Use the default error message.
        }

        throw new Error(message);
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("User deleted successfully.");
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>User Management</h2>

      <form className="purchase-form" onSubmit={handleSubmit}>
        <h3>{editingId !== null ? "Update User" : "Add New User"}</h3>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder={
            editingId !== null
              ? "New Password (leave blank to keep current)"
              : "Password"
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={editingId === null}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="ADMIN">Admin</option>
          <option value="LOGISTICS_OFFICER">Logistics Officer</option>
          <option value="BASE_COMMANDER">Base Commander</option>
        </select>

        <select
          value={baseId}
          onChange={(e) => setBaseId(e.target.value)}
        >
          <option value="">No Base Assigned</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.name} - {base.location}
            </option>
          ))}
        </select>

        <button type="submit">
          {editingId !== null ? "Update User" : "Add User"}
        </button>

        {editingId !== null && (
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <h3>All Users</h3>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Base</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role?.replaceAll("_", " ")}</td>
                  <td>{user.base?.name || "-"}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id)}
                    >
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

export default Users;