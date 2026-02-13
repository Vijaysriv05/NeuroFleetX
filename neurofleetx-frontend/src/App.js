import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { ProfileProvider } from "./contexts/ProfileContext";

// Components
import Home from "./components/Home";
import Login from './components/Login';
import Register from "./components/Register";
import Profile from "./components/Profile";
import Vehicles from "./components/Vehicles";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";
import api from './api';

// Dashboards
import AdminDashboard from "./dashboards/AdminDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import DriverDashboard from "./dashboards/DriverDashboard";
import CustomerDashboard from "./dashboards/CustomerDashboard";

function App() {
  const [message, setMessage] = useState('');

  const testBackend = async () => {
    try {
      const res = await api.get('/ping');
      setMessage(`CONNECTION_LIVE: ${res.data}`);
    } catch (err) {
      console.error("UPLINK_FAILURE:", err);
      setMessage("BACKEND_OFFLINE: DATABASE_SYNC_ERR");
    }
  };

  return (
    <ProfileProvider>
      <Router>
        {/* Global Toast Notification System */}
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />

        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={
            <>
              <div className="connection-tester" style={{
                padding: '12px 24px',
                background: '#05070a',
                borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <button
                  onClick={testBackend}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid #6366f1',
                    color: '#6366f1',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: '900',
                    letterSpacing: '1px'
                  }}>
                  SYSTEM_CHECK
                </button>
                <span style={{
                  color: message.includes('LIVE') ? '#10b981' : '#ef4444',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold'
                }}>
                  {message || "STATUS: STANDBY"}
                </span>
              </div>
              <Home />
            </>
          } />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Core Protected Routes (Accessible by any logged-in user) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/vehicles" element={<Vehicles />} />
          </Route>

          {/* Role-Based Access Control (RBAC)
            - Role ID 1: Admin (Full System Control & User Management)
            - Role ID 2: Manager (Fleet & Operation Oversight)
            - Role ID 3: Driver (Telemetry & Trip Execution)
            - Role ID 4: Customer (Booking & Tracking)
          */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleProtectedRoute allowedRoleIds={[1]}>
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/manager/dashboard"
            element={
              <RoleProtectedRoute allowedRoleIds={[2]}>
                <ManagerDashboard />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/driver/dashboard"
            element={
              <RoleProtectedRoute allowedRoleIds={[3]}>
                <DriverDashboard />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/customer/dashboard"
            element={
              <RoleProtectedRoute allowedRoleIds={[4]}>
                <CustomerDashboard />
              </RoleProtectedRoute>
            }
          />

          {/* Catch-all: Redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ProfileProvider>
  );
}

export default App;