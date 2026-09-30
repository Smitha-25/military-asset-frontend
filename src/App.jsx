
import { useState } from "react";
import "./App.css";
import Purchases from "./Purchases";
import Transfers from "./Transfers";
import Assignments from "./Assignments";
import Expenditures from "./Expenditures";
import Stock from "./Stock";
import Bases from "./Bases";
import Equipment from "./Equipment";
import Users from "./Users";
import AuditLogs from "./AuditLogs";

const API_URL = "http://https://military-asset-backend-pxae.onrender.com";

async function checkAccess(endpoint, authHeader) {
  const response = await fetch(API_URL + endpoint, {
    headers: { Authorization: authHeader },
  });

  if (response.status === 401) {
    throw new Error("Invalid email or password.");
  }

  if (response.status === 403) {
    return false;
  }

  if (!response.ok) {
    throw new Error("Unable to verify account permissions.");
  }

  return true;
}

async function detectRole(authHeader) {
  if (await checkAccess("/api/users", authHeader)) {
    return "ADMIN";
  }

  if (await checkAccess("/api/transfers", authHeader)) {
    return "LOGISTICS_OFFICER";
  }

  if (await checkAccess("/api/assignments", authHeader)) {
    return "BASE_COMMANDER";
  }

  throw new Error("This account does not have a recognized role.");
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState("dashboard");

  // Dashboard filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [baseId, setBaseId] = useState("");
  const [equipmentType, setEquipmentType] = useState("");

  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState("");

  // Load dashboard with optional filters
  const loadDashboard = async (authHeader, filters = {}) => {
    const params = new URLSearchParams();

    if (filters.startDate) {
      params.append("startDate", filters.startDate);
    }

    if (filters.endDate) {
      params.append("endDate", filters.endDate);
    }

    if (filters.baseId) {
      params.append("baseId", filters.baseId);
    }

    if (filters.equipmentType) {
      params.append("equipmentType", filters.equipmentType);
    }

    const query = params.toString();
    const url = `${API_URL}/api/dashboard${query ? `?${query}` : ""}`;

    const response = await fetch(url, {
      headers: { Authorization: authHeader },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Unable to load dashboard.");
    }

    return await response.json();
  };

  // Load bases and equipment types for the filters
  const loadFilterOptions = async (authHeader) => {
    try {
      const [baseResponse, equipmentResponse] = await Promise.all([
        fetch(`${API_URL}/api/bases`, {
          headers: { Authorization: authHeader },
        }),
        fetch(`${API_URL}/api/equipment`, {
          headers: { Authorization: authHeader },
        }),
      ]);

      if (!baseResponse.ok || !equipmentResponse.ok) {
        throw new Error("Unable to load filter options.");
      }

      const baseData = await baseResponse.json();
      const equipmentData = await equipmentResponse.json();

      const baseList = Array.isArray(baseData)
        ? baseData
        : baseData.content || [];

      const equipmentList = Array.isArray(equipmentData)
        ? equipmentData
        : equipmentData.content || [];

      setBases(baseList);

      const types = [
        ...new Set(
          equipmentList
            .map((item) => item.type)
            .filter(Boolean)
        ),
      ];

      setEquipmentTypes(types);
    } catch (err) {
      console.error("Unable to load filter options:", err);
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const authHeader =
      "Basic " + btoa(`${email.trim()}:${password}`);

    try {
      const detectedRole = await detectRole(authHeader);

      let dashboardData = null;

      if (detectedRole !== "LOGISTICS_OFFICER") {
        dashboardData = await loadDashboard(authHeader);
        await loadFilterOptions(authHeader);
      }

      setDashboard(dashboardData);
      setPage(
        detectedRole === "LOGISTICS_OFFICER"
          ? "purchases"
          : "dashboard"
      );

      setUser({
        email: email.trim(),
        role: detectedRole,
        authHeader,
      });
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the backend. Check that it is running."
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Apply dashboard filters
  const handleApplyFilters = async () => {
    if (startDate && endDate && startDate > endDate) {
      setFilterError("From Date cannot be after To Date.");
      return;
    }

    setFilterError("");
    setFilterLoading(true);

    try {
      const data = await loadDashboard(user.authHeader, {
        startDate,
        endDate,
        baseId,
        equipmentType,
      });

      setDashboard(data);
    } catch (err) {
      setFilterError(err.message);
    } finally {
      setFilterLoading(false);
    }
  };

  // Reset all dashboard filters
  const handleResetFilters = async () => {
    setStartDate("");
    setEndDate("");
    setBaseId("");
    setEquipmentType("");
    setFilterError("");
    setFilterLoading(true);

    try {
      const data = await loadDashboard(user.authHeader);
      setDashboard(data);
    } catch (err) {
      setFilterError(err.message);
    } finally {
      setFilterLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    setDashboard(null);
    setEmail("");
    setPassword("");
    setPage("dashboard");

    setStartDate("");
    setEndDate("");
    setBaseId("");
    setEquipmentType("");

    setBases([]);
    setEquipmentTypes([]);
    setFilterLoading(false);
    setFilterError("");
    setError("");
  };

  if (user) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h2>Military Asset Management</h2>
          <div>
            <span>{user.role.replaceAll("_", " ")}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <nav className="app-nav">
          {user.role !== "LOGISTICS_OFFICER" && (
            <button
              onClick={() => setPage("dashboard")}
              className={page === "dashboard" ? "active-nav" : ""}
            >
              Dashboard
            </button>
          )}

          {user.role === "ADMIN" && (
            <>
              <button
                onClick={() => setPage("bases")}
                className={page === "bases" ? "active-nav" : ""}
              >
                Bases
              </button>

              <button
                onClick={() => setPage("equipment")}
                className={page === "equipment" ? "active-nav" : ""}
              >
                Equipment
              </button>

              <button
                onClick={() => setPage("users")}
                className={page === "users" ? "active-nav" : ""}
              >
                Users
              </button>

              <button
                onClick={() => setPage("auditLogs")}
                className={page === "auditLogs" ? "active-nav" : ""}
              >
                Audit Logs
              </button>
            </>
          )}

          {(user.role === "ADMIN" ||
            user.role === "LOGISTICS_OFFICER") && (
            <>
              <button
                onClick={() => setPage("purchases")}
                className={page === "purchases" ? "active-nav" : ""}
              >
                Purchases
              </button>

              <button
                onClick={() => setPage("transfers")}
                className={page === "transfers" ? "active-nav" : ""}
              >
                Transfers
              </button>
            </>
          )}

          {(user.role === "ADMIN" ||
            user.role === "BASE_COMMANDER") && (
            <>
              <button
                onClick={() => setPage("assignments")}
                className={page === "assignments" ? "active-nav" : ""}
              >
                Assignments
              </button>

              <button
                onClick={() => setPage("expenditures")}
                className={page === "expenditures" ? "active-nav" : ""}
              >
                Expenditures
              </button>

              <button
                onClick={() => setPage("stock")}
                className={page === "stock" ? "active-nav" : ""}
              >
                Stock
              </button>
            </>
          )}
        </nav>

        {page === "bases" && user.role === "ADMIN" && (
          <Bases authHeader={user.authHeader} />
        )}

        {page === "equipment" && user.role === "ADMIN" && (
          <Equipment authHeader={user.authHeader} />
        )}

        {page === "users" && user.role === "ADMIN" && (
          <Users authHeader={user.authHeader} />
        )}

        {page === "auditLogs" && user.role === "ADMIN" && (
          <AuditLogs authHeader={user.authHeader} />
        )}

        {page === "purchases" &&
          (user.role === "ADMIN" ||
            user.role === "LOGISTICS_OFFICER") && (
            <Purchases authHeader={user.authHeader} />
          )}

        {page === "transfers" &&
          (user.role === "ADMIN" ||
            user.role === "LOGISTICS_OFFICER") && (
            <Transfers authHeader={user.authHeader} />
          )}

        {page === "assignments" &&
          (user.role === "ADMIN" ||
            user.role === "BASE_COMMANDER") && (
            <Assignments authHeader={user.authHeader} />
          )}

        {page === "expenditures" &&
          (user.role === "ADMIN" ||
            user.role === "BASE_COMMANDER") && (
            <Expenditures authHeader={user.authHeader} />
          )}

        {page === "stock" &&
          (user.role === "ADMIN" ||
            user.role === "BASE_COMMANDER") && (
            <Stock authHeader={user.authHeader} />
          )}

        {page === "dashboard" &&
          user.role !== "LOGISTICS_OFFICER" && (
            <main className="dashboard">
              <h2>Dashboard</h2>
              <p>Welcome, {user.email}</p>

              {/* Dashboard filters */}
              <div className="dashboard-filters">
                <div className="filter-group">
                  <label htmlFor="startDate">From Date</label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="endDate">To Date</label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {user.role === "ADMIN" && (
                  <div className="filter-group">
                    <label htmlFor="baseId">Base</label>
                    <select
                      id="baseId"
                      value={baseId}
                      onChange={(e) => setBaseId(e.target.value)}
                    >
                      <option value="">All Bases</option>
                      {bases.map((base) => (
                        <option key={base.id} value={base.id}>
                          {base.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="filter-group">
                  <label htmlFor="equipmentType">
                    Equipment Type
                  </label>
                  <select
                    id="equipmentType"
                    value={equipmentType}
                    onChange={(e) =>
                      setEquipmentType(e.target.value)
                    }
                  >
                    <option value="">All Equipment Types</option>
                    {equipmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-actions">
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    disabled={filterLoading}
                  >
                    {filterLoading ? "Applying..." : "Apply Filters"}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    disabled={filterLoading}
                    className="reset-filter-btn"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {filterError && (
                <p className="error">{filterError}</p>
              )}

              {/* Dashboard metric cards */}
              <div className="metrics">
                <div className="metric-card">
                  <h3>Opening Balance</h3>
                  <p>{dashboard?.openingBalance ?? "-"}</p>
                </div>

                <div className="metric-card">
                  <h3>Closing Balance</h3>
                  <p>{dashboard?.closingBalance ?? "-"}</p>
                </div>

                <div className="metric-card">
                  <h3>Net Movement</h3>
                  <p>{dashboard?.netMovement ?? "-"}</p>
                </div>

                <div className="metric-card">
                  <h3>Assigned</h3>
                  <p>{dashboard?.assigned ?? "-"}</p>
                </div>

                <div className="metric-card">
                  <h3>Expended</h3>
                  <p>{dashboard?.expended ?? "-"}</p>
                </div>
              </div>
            </main>
          )}
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>Military Asset Management</h1>
        <p className="subtitle">Sign in to continue</p>

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default App;







// import { useState } from "react";
// import "./App.css";
// import Purchases from "./Purchases";
// import Transfers from "./Transfers";
// import Assignments from "./Assignments";
// import Expenditures from "./Expenditures";
// import Stock from "./Stock";
// import Bases from "./Bases";
// import Equipment from "./Equipment";
// import Users from "./Users";
// import AuditLogs from "./AuditLogs";

// const API_URL = "http://https://military-asset-backend-pxae.onrender.com";

// async function checkAccess(endpoint, authHeader) {
//   const response = await fetch(API_URL + endpoint, {
//     headers: { Authorization: authHeader },
//   });

//   if (response.status === 401) {
//     throw new Error("Invalid email or password.");
//   }

//   if (response.status === 403) {
//     return false;
//   }

//   if (!response.ok) {
//     throw new Error("Unable to verify account permissions.");
//   }

//   return true;
// }

// async function detectRole(authHeader) {
//   if (await checkAccess("/api/users", authHeader)) {
//     return "ADMIN";
//   }

//   if (await checkAccess("/api/transfers", authHeader)) {
//     return "LOGISTICS_OFFICER";
//   }

//   if (await checkAccess("/api/assignments", authHeader)) {
//     return "BASE_COMMANDER";
//   }

//   throw new Error("This account does not have a recognized role.");
// }

// function App() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [user, setUser] = useState(null);
//   const [dashboard, setDashboard] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState("dashboard");

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     const authHeader =
//       "Basic " + btoa(`${email.trim()}:${password}`);

//     try {
//       const detectedRole = await detectRole(authHeader);

//       let dashboardData = null;

//       if (detectedRole !== "LOGISTICS_OFFICER") {
//         const dashboardResponse = await fetch(
//           API_URL + "/api/dashboard",
//           { headers: { Authorization: authHeader } }
//         );

//         if (!dashboardResponse.ok) {
//           throw new Error("Unable to load dashboard.");
//         }

//         dashboardData = await dashboardResponse.json();
//       }

//       setDashboard(dashboardData);
//       setPage(
//         detectedRole === "LOGISTICS_OFFICER"
//           ? "purchases"
//           : "dashboard"
//       );

//       setUser({
//         email: email.trim(),
//         role: detectedRole,
//         authHeader,
//       });
//     } catch (err) {
//       if (err instanceof TypeError) {
//         setError("Cannot connect to the backend. Check that it is running.");
//       } else {
//         setError(err.message);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     setUser(null);
//     setDashboard(null);
//     setEmail("");
//     setPassword("");
//     setPage("dashboard");
//     setError("");
//   };

//   if (user) {
//     return (
//       <div className="app-container">
//         <header className="app-header">
//           <h2>Military Asset Management</h2>
//           <div>
//             <span>{user.role.replaceAll("_", " ")}</span>
//             <button className="logout-btn" onClick={handleLogout}>
//               Logout
//             </button>
//           </div>
//         </header>

//         <nav className="app-nav">
//           {user.role !== "LOGISTICS_OFFICER" && (
//             <button
//               onClick={() => setPage("dashboard")}
//               className={page === "dashboard" ? "active-nav" : ""}
//             >
//               Dashboard
//             </button>
//           )}

//           {user.role === "ADMIN" && (
//             <>
//               <button
//                 onClick={() => setPage("bases")}
//                 className={page === "bases" ? "active-nav" : ""}
//               >
//                 Bases
//               </button>

//               <button
//                 onClick={() => setPage("equipment")}
//                 className={page === "equipment" ? "active-nav" : ""}
//               >
//                 Equipment
//               </button>

//               <button
//                 onClick={() => setPage("users")}
//                 className={page === "users" ? "active-nav" : ""}
//               >
//                 Users
//               </button>

//               <button
//                 onClick={() => setPage("auditLogs")}
//                 className={page === "auditLogs" ? "active-nav" : ""}
//               >
//                 Audit Logs
//               </button>
//             </>
//           )}

//           {(user.role === "ADMIN" ||
//             user.role === "LOGISTICS_OFFICER") && (
//             <>
//               <button
//                 onClick={() => setPage("purchases")}
//                 className={page === "purchases" ? "active-nav" : ""}
//               >
//                 Purchases
//               </button>

//               <button
//                 onClick={() => setPage("transfers")}
//                 className={page === "transfers" ? "active-nav" : ""}
//               >
//                 Transfers
//               </button>
//             </>
//           )}

//           {(user.role === "ADMIN" ||
//             user.role === "BASE_COMMANDER") && (
//             <>
//               <button
//                 onClick={() => setPage("assignments")}
//                 className={page === "assignments" ? "active-nav" : ""}
//               >
//                 Assignments
//               </button>

//               <button
//                 onClick={() => setPage("expenditures")}
//                 className={page === "expenditures" ? "active-nav" : ""}
//               >
//                 Expenditures
//               </button>

//               <button
//                 onClick={() => setPage("stock")}
//                 className={page === "stock" ? "active-nav" : ""}
//               >
//                 Stock
//               </button>
//             </>
//           )}
//         </nav>

//         {page === "bases" && user.role === "ADMIN" && (
//           <Bases authHeader={user.authHeader} />
//         )}

//         {page === "equipment" && user.role === "ADMIN" && (
//           <Equipment authHeader={user.authHeader} />
//         )}

//         {page === "users" && user.role === "ADMIN" && (
//           <Users authHeader={user.authHeader} />
//         )}

//         {page === "auditLogs" && user.role === "ADMIN" && (
//           <AuditLogs authHeader={user.authHeader} />
//         )}

//         {page === "purchases" &&
//           (user.role === "ADMIN" ||
//             user.role === "LOGISTICS_OFFICER") && (
//             <Purchases authHeader={user.authHeader} />
//           )}

//         {page === "transfers" &&
//           (user.role === "ADMIN" ||
//             user.role === "LOGISTICS_OFFICER") && (
//             <Transfers authHeader={user.authHeader} />
//           )}

//         {page === "assignments" &&
//           (user.role === "ADMIN" ||
//             user.role === "BASE_COMMANDER") && (
//             <Assignments authHeader={user.authHeader} />
//           )}

//         {page === "expenditures" &&
//           (user.role === "ADMIN" ||
//             user.role === "BASE_COMMANDER") && (
//             <Expenditures authHeader={user.authHeader} />
//           )}

//         {page === "stock" &&
//           (user.role === "ADMIN" ||
//             user.role === "BASE_COMMANDER") && (
//             <Stock authHeader={user.authHeader} />
//           )}

//         {page === "dashboard" &&
//           user.role !== "LOGISTICS_OFFICER" && (
//             <main className="dashboard">
//               <h2>Dashboard</h2>
//               <p>Welcome, {user.email}</p>

//               <div className="metrics">
//                 <div className="metric-card">
//                   <h3>Opening Balance</h3>
//                   <p>{dashboard?.openingBalance ?? "-"}</p>
//                 </div>

//                 <div className="metric-card">
//                   <h3>Closing Balance</h3>
//                   <p>{dashboard?.closingBalance ?? "-"}</p>
//                 </div>

//                 <div className="metric-card">
//                   <h3>Net Movement</h3>
//                   <p>{dashboard?.netMovement ?? "-"}</p>
//                 </div>

//                 <div className="metric-card">
//                   <h3>Assigned</h3>
//                   <p>{dashboard?.assigned ?? "-"}</p>
//                 </div>

//                 <div className="metric-card">
//                   <h3>Expended</h3>
//                   <p>{dashboard?.expended ?? "-"}</p>
//                 </div>
//               </div>
//             </main>
//           )}
//       </div>
//     );
//   }

//   return (
//     <div className="login-page">
//       <form className="login-card" onSubmit={handleLogin}>
//         <h1>Military Asset Management</h1>
//         <p className="subtitle">Sign in to continue</p>

//         <label>Email</label>
//         <input
//           type="email"
//           placeholder="Enter your email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />

//         <label>Password</label>
//         <input
//           type="password"
//           placeholder="Enter your password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />

//         {error && <p className="error">{error}</p>}

//         <button type="submit" disabled={loading}>
//           {loading ? "Signing in..." : "Login"}
//         </button>
//       </form>
//     </div>
//   );
// }

// export default App;