// src/routes/RoleProtectedRoute.js
// src/routes/RoleProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const RoleProtectedRoute = ({ children, allowedRoleIds }) => {
  const token = localStorage.getItem("token");
  const userRoleId = Number(localStorage.getItem("roleId"));

  if (!token) return <Navigate to="/login" replace />;

  if (!allowedRoleIds || !allowedRoleIds.includes(userRoleId)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleProtectedRoute;




