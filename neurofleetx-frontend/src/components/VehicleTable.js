import React, { useEffect, useState } from "react";
import api from "../api";
import VehicleCard from "./VehicleCard";

const VehicleGrid = () => {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get("/customer/vehicles")
      .then((res) => setVehicles(res.data))
      .catch((err) => console.error("Error loading fleet data:", err));
  }, []);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Fleet Inventory & Telemetry [cite: 118]</h2>

      {/* Grid Layout as per Project Document  */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <VehicleCard key={v.id} vehicle={v} />
        ))}
      </div>
    </div>
  );
};

export default VehicleGrid;