import React, { useEffect, useState } from "react";
import api from "../api";
import VehicleCard from "./VehicleCard";
import { Search, Zap, MapPin, Database, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

// role prop should be "admin" or "manager" for professional dashboards and "customer" for user side
const VehicleGrid = ({ onRefreshStats, onSimulate, role = "admin" }) => {
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [activeId, setActiveId] = useState(null);

  // Track which dropdown is open to prevent "instability"
  const [openRelocateId, setOpenRelocateId] = useState(null);

  const demandZones = ["DOWNTOWN", "AIRPORT", "INDUSTRIAL"];

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles/master");
      setVehicles(res.data);
    } catch (err) {
      console.error("Fetch failed:", err);
      toast.error("DATABASE_OFFLINE: SYNC_FAILED");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/customer/vehicles/${currentVehicle.id}`, currentVehicle);
      if (res.status === 200) {
        setVehicles(prev => prev.map(v => v.id === currentVehicle.id ? currentVehicle : v));
        if (onRefreshStats) onRefreshStats();
        setIsEditModalOpen(false);
        toast.success("UNIT_PARAMETERS_RECONFIGURED");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("SYNC_ERROR: BACKEND_REJECTED_PUT");
    }
  };

  const handleRelocate = async (vehicleId, newZone) => {
    try {
      const vehicleToMove = vehicles.find(v => v.id === vehicleId);
      const relocatingData = { ...vehicleToMove, status: "RELOCATING" };
      await api.put(`/customer/vehicles/${vehicleId}`, relocatingData);

      setVehicles(prev => prev.map(v => v.id === vehicleId ? relocatingData : v));
      setOpenRelocateId(null);
      toast.info(`DISPATCHED: Unit ${vehicleId} is en route to ${newZone}`);

      setTimeout(async () => {
        const arrivalData = { ...relocatingData, status: "AVAILABLE", location: newZone };
        try {
          await api.put(`/customer/vehicles/${vehicleId}`, arrivalData);
          setVehicles(prev => prev.map(v => v.id === vehicleId ? arrivalData : v));
          if (onRefreshStats) onRefreshStats();
          toast.success(`ARRIVED: Unit ${vehicleId} is now online at ${newZone}`);
        } catch (err) {
          toast.error(`SIGNAL_LOST: Unit ${vehicleId} failed to report arrival.`);
        }
      }, 10000);
    } catch (err) {
      toast.error("RE-ALLOCATION_FAILED: UPLINK_INTERRUPTED");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("CRITICAL: Decommission this unit from database?")) {
      try {
        await api.delete(`/customer/vehicles/${id}`);
        setVehicles(prev => prev.filter(v => v.id !== id));
        if (onRefreshStats) onRefreshStats();
        toast.success("UNIT_DECOMMISSIONED");
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("TERMINATION_FAILED: SERVER_REJECTED_DELETE");
      }
    }
  };

  const handleRequest = (vehicle) => {
    toast.info(`REQUEST_SENT: Node ${vehicle.id} initialization requested.`);
  };

  const filteredVehicles = vehicles.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      v.model?.toLowerCase().includes(term) ||
      v.id?.toString().includes(term) ||
      v.status?.toLowerCase().includes(term) ||
      v.location?.toLowerCase().includes(term) ||
      v.vehicleCondition?.toLowerCase().includes(term)
    );
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="text-indigo-400 font-black animate-pulse text-center tracking-[0.4em] text-xs">
        RE-ESTABLISHING_ENCRYPTED_LINK...
      </div>
    </div>
  );

  return (
    <div className="mt-8 px-4 relative">
      {/* Background Polish */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/5 blur-[120px] -z-10 pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
        <div className="flex items-center gap-5">
          <div className="h-12 w-2 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full shadow-[0_0_25px_rgba(99,102,241,0.6)]"></div>
          <div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500 italic uppercase tracking-tighter flex items-center gap-3">
              <Database className="text-indigo-500 w-8 h-8" />
              {role === "customer" ? "Node_Discovery" : "Fleet_Inventory"}
            </h2>
            <div className="text-[10px] font-bold text-indigo-500/80 tracking-[0.3em] uppercase ml-1 mt-1">
              System_Status: Operational // Build_v4.2
            </div>
          </div>
        </div>

        {/* UPDATED SEARCH BAR UI */}
        <div className="relative w-full lg:w-[450px] group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-900 group-focus-within:text-indigo-600 transition-colors w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Search Model, ID, Status, or Location..."
            className="relative block w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-300 rounded-2xl text-slate-950 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 backdrop-blur-md transition-all placeholder:text-slate-400 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((v) => (
              <motion.div
                key={v.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setActiveId(v.id)}
                className="relative group cursor-pointer"
                onMouseLeave={() => setOpenRelocateId(null)}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[2rem] blur opacity-0 group-hover:opacity-10 transition duration-500"></div>

                <VehicleCard
                  vehicle={v}
                  isActive={activeId === v.id}
                  viewMode={role === "customer" ? "customer-dashboard" : "admin-inventory"}
                  onDelete={(role === "admin" || role === "manager") ? handleDelete : null}
                  onEdit={
                    role === "admin"
                    ? (selectedVehicle) => {
                        setCurrentVehicle({ ...selectedVehicle });
                        setIsEditModalOpen(true);
                      }
                    : role === "manager"
                      ? onSimulate
                      : null
                  }
                  onRequest={handleRequest}
                />

                {role === "manager" && (
                  <div className="absolute top-5 right-5 z-[100] flex flex-col gap-2 items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (onSimulate) onSimulate(v); }}
                      className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-1.5 rounded-lg shadow-xl shadow-indigo-500/40 hover:scale-105 transition-all"
                    >
                      <Zap size={12} fill="currentColor" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Simulate</span>
                    </button>

                    {v.status === "AVAILABLE" && (
                      <div className="relative">
                        <button
                          onMouseEnter={() => setOpenRelocateId(v.id)}
                          onClick={(e) => { e.stopPropagation(); setOpenRelocateId(openRelocateId === v.id ? null : v.id); }}
                          className="flex items-center gap-2 bg-emerald-500 text-black px-3 py-1.5 rounded-lg shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all font-black uppercase text-[10px]"
                        >
                          <MapPin size={12} fill="currentColor" /> Relocate
                        </button>

                        {openRelocateId === v.id && (
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute top-0 right-full mr-3 w-44 bg-[#0d1117] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[999] backdrop-blur-2xl"
                          >
                            <div className="px-4 py-2 bg-white/5 text-[9px] font-bold text-slate-500 border-b border-white/5">SELECT_DESTINATION</div>
                            {demandZones.map(zone => (
                              <button
                                key={zone}
                                onClick={(e) => { e.stopPropagation(); handleRelocate(v.id, zone); }}
                                className="w-full text-left px-4 py-3 text-[11px] font-black uppercase text-slate-300 hover:bg-emerald-500 hover:text-black transition-all border-b border-white/5 last:border-0"
                              >
                                {zone}_CLUSTER
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[4rem] bg-white/[0.02]">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Search className="text-slate-700 w-8 h-8" />
               </div>
               <p className="text-slate-500 font-black uppercase tracking-[0.3em] italic text-sm">No_Matching_Nodes_Found</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {isEditModalOpen && role === "admin" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl flex justify-center items-center z-[5000] p-6 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-[#0b0e14] p-10 rounded-[3rem] w-full max-w-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] my-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

            <div className="flex justify-between items-start mb-10">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                  <Cpu className="text-indigo-500 w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Node_Reconfig</h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    Active Session: {currentVehicle?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 rounded-full transition-all text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-left">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest block flex items-center gap-2">
                  <span className="w-1 h-1 bg-indigo-500"></span> Vehicle Model Name
                </label>
                <input
                  className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all font-bold"
                  value={currentVehicle?.model || ""}
                  onChange={(e) => setCurrentVehicle({ ...currentVehicle, model: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest block flex items-center gap-2">
                   <span className="w-1 h-1 bg-indigo-500"></span> Operational Status
                </label>
                <select
                  className="w-full p-4 bg-[#161b22] border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold cursor-pointer"
                  value={currentVehicle?.status || ""}
                  onChange={(e) => setCurrentVehicle({ ...currentVehicle, status: e.target.value })}
                >
                  <option value="AVAILABLE">🟢 AVAILABLE</option>
                  <option value="IN USE">🔵 IN USE</option>
                  <option value="NEEDS_SERVICE">🟡 NEEDS_SERVICE</option>
                  <option value="MAINTENANCE">🔴 MAINTENANCE</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest block">Current Location</label>
                <input
                  className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 transition-all font-bold"
                  value={currentVehicle?.location || ""}
                  onChange={(e) => setCurrentVehicle({ ...currentVehicle, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest block italic">Fuel_Cap %</label>
                  <input type="number" className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none font-mono"
                    value={currentVehicle?.fuel || 0}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, fuel: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest block italic">Velocity KM/H</label>
                  <input type="number" className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none font-mono"
                    value={currentVehicle?.speed || 0}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, speed: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest block">Seat Capacity</label>
                <input type="number" className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none font-bold"
                  value={currentVehicle?.seats || 0}
                  onChange={(e) => setCurrentVehicle({ ...currentVehicle, seats: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest block">Price Rate ($)</label>
                <input type="number" step="0.01" className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none font-bold"
                  value={currentVehicle?.price || 0}
                  onChange={(e) => setCurrentVehicle({ ...currentVehicle, price: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest block italic text-indigo-400">System_Health</label>
                <select
                  className="w-full p-4 bg-[#161b22] border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold"
                  value={currentVehicle?.vehicleCondition || ""}
                  onChange={(e) => setCurrentVehicle({...currentVehicle, vehicleCondition: e.target.value})}
                >
                  <option value="OPTIMAL">OPTIMAL</option>
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest block">Tire Pressure (PSI)</label>
                <input type="number" step="0.1" className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none font-bold"
                  value={currentVehicle?.tirePressure || 0}
                  onChange={(e) => setCurrentVehicle({ ...currentVehicle, tirePressure: parseFloat(e.target.value) })}
                />
              </div>

              <button type="submit" className="md:col-span-2 w-full bg-gradient-to-r from-indigo-600 to-blue-600 py-6 rounded-2xl text-white font-black hover:brightness-125 uppercase tracking-[0.3em] transition-all shadow-2xl shadow-indigo-500/30 mt-6 active:scale-[0.98]">
                COMMIT_DATA_CHANGES
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VehicleGrid;