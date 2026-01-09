// src/App.js
// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
      setMessage(res.data);
    } catch (err) {
      console.error("FULL ERROR OBJECT:", err);
      if (err.response) {
        setMessage(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        setMessage("No response from backend (CORS or backend not running)");
      } else {
        setMessage(err.message);
      }
    }
  };

  return (
    <ProfileProvider>
      <Router>
        <div style={{ textAlign: 'center', margin: '20px' }}>
          <button onClick={testBackend}>Test Backend Connection</button>
          <p>{message}</p>
        </div>

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <Vehicles />
              </ProtectedRoute>
            }
          />

          {/* Role-based Dashboards */}
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

          {/* Catch-all */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </ProfileProvider>
  );
}

export default App;
