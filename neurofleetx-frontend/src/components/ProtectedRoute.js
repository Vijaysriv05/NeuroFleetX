// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check if user is logged in
  const token = localStorage.getItem("token");
  const roleId = localStorage.getItem("roleId"); // optional, useful if you want role info

  // Not logged in → redirect to login
  if (!token || !roleId) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → render the child component
  return children;
};

export default ProtectedRoute;






