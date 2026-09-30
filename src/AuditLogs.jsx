
import { useEffect, useState } from "react";

function AuditLogs({ authHeader }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const API = "http://localhost:9090";

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API}/api/audit-logs`, {
          headers: {
            Authorization: authHeader,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch audit logs.");
        }

        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [authHeader]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "-";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN");
  };

  return (
    <div>
      <h2>Audit Logs</h2>

      {loading && <p>Loading audit logs...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5">No audit logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.user?.name || "System"}</td>
                    <td>{log.action || "-"}</td>
                    <td>{log.details || "-"}</td>
                    <td>{formatTimestamp(log.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;