import React from "react";
import DashboardHeader from "../contexts/dashboard/DashboardHeader";

const DriverDashboard = () => {
  return (
    <div className="max-w-3xl mx-auto mt-6">
      {/* Mini-profile and header */}
      <DashboardHeader title="Driver Dashboard" />


      {/* Dashboard cards */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl shadow">
        Assigned Trips / Vehicles
      </div>
    </div>
  );
};

export default DriverDashboard;


