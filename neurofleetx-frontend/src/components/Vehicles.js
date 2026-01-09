import React, { useEffect, useState } from "react";
import api from "../api";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [batteryPercentage, setBatteryPercentage] = useState("");
  const [fuelPercentage, setFuelPercentage] = useState("");
  const [currentLatitude, setCurrentLatitude] = useState("");
  const [currentLongitude, setCurrentLongitude] = useState("");
  const [editingVehicleId, setEditingVehicleId] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/vehicles");
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles", error);
    }
  };

  const handleAddVehicle = async () => {
    if (
      !vehicleName ||
      !vehicleType ||
      batteryPercentage === "" ||
      fuelPercentage === "" ||
      currentLatitude === "" ||
      currentLongitude === ""
    ) {
      alert("Please fill all fields");
      return;
    }

    const newVehicle = {
      vehicleName,
      vehicleType,
      status,
      batteryPercentage: Number(batteryPercentage),
      fuelPercentage: Number(fuelPercentage),
      currentLatitude: Number(currentLatitude),
      currentLongitude: Number(currentLongitude),
    };

    try {
      const response = await api.post("/vehicles", newVehicle);
      setVehicles([...vehicles, response.data]);
      resetForm();
    } catch (error) {
      console.error("Error adding vehicle", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await api.delete(`/vehicles/${id}`);
        setVehicles(vehicles.filter((v) => v.vehicleId !== id));
      } catch (error) {
        console.error("Error deleting vehicle", error);
      }
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicleId(vehicle.vehicleId);
    setVehicleName(vehicle.vehicleName);
    setVehicleType(vehicle.vehicleType);
    setStatus(vehicle.status);
    setBatteryPercentage(vehicle.batteryPercentage);
    setFuelPercentage(vehicle.fuelPercentage);
    setCurrentLatitude(vehicle.currentLatitude);
    setCurrentLongitude(vehicle.currentLongitude);
  };

  const handleUpdateVehicle = async () => {
    if (
      !vehicleName ||
      !vehicleType ||
      batteryPercentage === "" ||
      fuelPercentage === "" ||
      currentLatitude === "" ||
      currentLongitude === ""
    ) {
      alert("Please fill all fields");
      return;
    }

    const updatedVehicle = {
      vehicleName,
      vehicleType,
      status,
      batteryPercentage: Number(batteryPercentage),
      fuelPercentage: Number(fuelPercentage),
      currentLatitude: Number(currentLatitude),
      currentLongitude: Number(currentLongitude),
    };

    try {
      const response = await api.put(`/vehicles/${editingVehicleId}`, updatedVehicle);
      setVehicles(
        vehicles.map((v) =>
          v.vehicleId === editingVehicleId ? response.data : v
        )
      );
      resetForm();
      setEditingVehicleId(null);
    } catch (error) {
      console.error("Error updating vehicle", error);
    }
  };

  const resetForm = () => {
    setVehicleName("");
    setVehicleType("");
    setStatus("AVAILABLE");
    setBatteryPercentage("");
    setFuelPercentage("");
    setCurrentLatitude("");
    setCurrentLongitude("");
  };

  const buttonStyle = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    color: "#fff",
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: "20px" }}>Fleet Inventory</h2>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "30px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Vehicle Name</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Vehicle Type</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Status</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Battery %</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Fuel %</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Latitude</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Longitude</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "15px" }}>
                No vehicles found
              </td>
            </tr>
          ) : (
            vehicles.map((v) => (
              <tr key={v.vehicleId}>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>{v.vehicleName}</td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>{v.vehicleType}</td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>{v.status}</td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>{v.batteryPercentage}</td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>{v.fuelPercentage}</td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>{v.currentLatitude}</td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>{v.currentLongitude}</td>
                <td style={{ padding: "8px", border: "1px solid #ccc", display: "flex", gap: "5px" }}>
                  <button
                    onClick={() => handleEdit(v)}
                    style={{ ...buttonStyle, backgroundColor: "#4CAF50" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v.vehicleId)}
                    style={{ ...buttonStyle, backgroundColor: "#F44336" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add / Edit Vehicle Form */}
      <h3 style={{ marginBottom: "15px" }}>
        {editingVehicleId ? "Edit Vehicle" : "Add Vehicle"}
      </h3>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Vehicle Name"
          value={vehicleName}
          onChange={(e) => setVehicleName(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", flex: "1 1 150px" }}
        />
        <input
          type="text"
          placeholder="Vehicle Type"
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", flex: "1 1 150px" }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", flex: "1 1 150px" }}
        >
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="IN_USE">IN_USE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
        <input
          type="number"
          placeholder="Battery %"
          min="0"
          max="100"
          value={batteryPercentage}
          onChange={(e) => setBatteryPercentage(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", flex: "1 1 100px" }}
        />
        <input
          type="number"
          placeholder="Fuel %"
          min="0"
          max="100"
          value={fuelPercentage}
          onChange={(e) => setFuelPercentage(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", flex: "1 1 100px" }}
        />
        <input
          type="number"
          step="0.0001"
          placeholder="Latitude"
          value={currentLatitude}
          onChange={(e) => setCurrentLatitude(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", flex: "1 1 120px" }}
        />
        <input
          type="number"
          step="0.0001"
          placeholder="Longitude"
          value={currentLongitude}
          onChange={(e) => setCurrentLongitude(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", flex: "1 1 120px" }}
        />

        {editingVehicleId ? (
          <>
            <button
              onClick={handleUpdateVehicle}
              style={{ ...buttonStyle, backgroundColor: "#2196F3" }}
            >
              Update Vehicle
            </button>
            <button
              onClick={() => {
                resetForm();
                setEditingVehicleId(null);
              }}
              style={{ ...buttonStyle, backgroundColor: "#9E9E9E" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={handleAddVehicle}
            style={{ ...buttonStyle, backgroundColor: "#4CAF50" }}
          >
            Add Vehicle
          </button>
        )}
      </div>
    </div>
  );
};

export default Vehicles;





