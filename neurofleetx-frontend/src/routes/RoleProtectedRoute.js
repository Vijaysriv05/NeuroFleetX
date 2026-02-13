// src/routes/RoleProtectedRoute.js
import { Navigate } from "react-router-dom";

const RoleProtectedRoute = ({ children, allowedRoleIds }) => {
  const token = localStorage.getItem("token");
  const roleId = Number(localStorage.getItem("roleId"));

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoleIds.includes(roleId)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
