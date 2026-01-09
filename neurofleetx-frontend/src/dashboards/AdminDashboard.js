import React from "react";
import DashboardHeader from "../contexts/dashboard/DashboardHeader";

const AdminDashboard = () => {
  return (
    <div className="max-w-6xl mx-auto mt-6">
      {/* Mini-profile and header */}
    <DashboardHeader title="Admin Dashboard" />


      {/* Dashboard cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-blue-100 rounded-xl shadow">Vehicle Stats Card</div>
        <div className="p-4 bg-green-100 rounded-xl shadow">Active Trips Card</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
