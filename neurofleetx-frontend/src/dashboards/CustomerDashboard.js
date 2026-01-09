import React from "react";
import DashboardHeader from "../contexts/dashboard/DashboardHeader";

const CustomerDashboard = () => {
  return (
    <div className="max-w-3xl mx-auto mt-6">
      {/* Mini-profile and header */}
<DashboardHeader title="Customer Dashboard" />


      {/* Dashboard cards */}
      <div className="mt-6 p-4 bg-green-50 rounded-xl shadow">
        Booking / Available Vehicles
      </div>
    </div>
  );
};

export default CustomerDashboard;
