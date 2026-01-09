import React from "react";
import DashboardHeader from "../contexts/dashboard/DashboardHeader";

const ManagerDashboard = () => {
  return (
    <div className="max-w-6xl mx-auto mt-6">
      {/* Mini-profile and header */}
      <DashboardHeader title="Manager Dashboard" />


      {/* Dashboard cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-yellow-100 rounded-xl shadow">Vehicle Overview</div>
        <div className="p-4 bg-purple-100 rounded-xl shadow">Driver Status</div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
