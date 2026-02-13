import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { toast } from "react-toastify";
import VehicleCard from "./VehicleCard";

const CustomerVehicleBrowser = ({ userId, onRefresh }) => {
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("DEFAULT");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableNodes();
  }, []);

  const fetchAvailableNodes = async () => {
    try {
      const res = await api.get("/vehicles/master");
      setAvailableVehicles(res.data);
    } catch (err) {
      console.error("Discovery Failed:", err);
      toast.error("SYSTEM_OFFLINE: UNABLE_TO_SCAN_NODES");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUplink = async (vehicle) => {
    try {
      const activeUserId = userId || localStorage.getItem("userId");
      const payload = {
        userId: activeUserId,
        vehicleId: vehicle.id,
        vehicleModel: vehicle.model || vehicle.vehicleModel,
        status: "pending"
      };

      const res = await api.post("/vehicles/register", payload);

      if (res.status === 200) {
        toast.success(`UPLINK_SUCCESS: ${vehicle.model} is now pending approval.`);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Uplink Error:", err);
      toast.error(err.response?.data?.message || "UPLINK_DENIED: DATABASE_SYNC_ERROR");
    }
  };

  const processedVehicles = useMemo(() => {
    let filtered = availableVehicles.filter((v) => {
      const query = searchTerm.toLowerCase();
      return (
        v.model?.toLowerCase().includes(query) ||
        v.location?.toLowerCase().includes(query) ||
        v.status?.toLowerCase().includes(query) ||
        v.vehicleCondition?.toLowerCase().includes(query) ||
        v.id?.toString().includes(query) ||
        v.price?.toString().includes(query) ||
        v.seats?.toString().includes(query)
      );
    });

    switch (sortBy) {
      case "PRICE_LOW":
        return [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
      case "PRICE_HIGH":
        return [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
      case "SEATS":
        return [...filtered].sort((a, b) => (b.seats || 0) - (a.seats || 0));
      case "HEALTH":
        const conditionMap = { 'OPTIMAL': 4, 'GOOD': 3, 'FAIR': 2, 'CRITICAL': 1, 'OFFLINE': 0 };
        return [...filtered].sort((a, b) => (conditionMap[b.vehicleCondition] || 0) - (conditionMap[a.vehicleCondition] || 0));
      default:
        return filtered;
    }
  }, [availableVehicles, searchTerm, sortBy]);

  if (loading) return (
    <div className="p-10 text-indigo-400 font-black animate-pulse italic uppercase text-center tracking-widest">
      Scanning_Global_Network...
    </div>
  );

  return (
    <div className="mt-12 text-left">
      {/* Search, Sort, and Toggle Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-1.5 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.6)]"></div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">NODE_DISCOVERY.DB</h2>
        </div>

        <div className="flex flex-wrap w-full xl:w-auto gap-4">
          {/* Search */}
          <div className="relative flex-grow md:min-w-[350px] group">
            <Search className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors w-5 h-5" />
            <input
              type="text"
              placeholder="Filter Nodes..."
              className="pl-12 pr-4 py-3.5 bg-[#0d1117] border border-white/5 rounded-2xl text-white w-full outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-slate-600 shadow-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-4 top-3.5 text-indigo-500 w-5 h-5 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-12 pr-10 py-3.5 bg-[#0d1117] border border-white/5 rounded-2xl text-white font-black italic uppercase text-xs tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer shadow-xl"
            >
              <option value="DEFAULT">SORT_BY</option>
              <option value="PRICE_LOW">PRICE: ASC</option>
              <option value="PRICE_HIGH">PRICE: DESC</option>
              <option value="SEATS">MAX_CAPACITY</option>
              <option value="HEALTH">HEALTH_PRIORITY</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-[#0d1117] p-1.5 rounded-2xl border border-white/5 shadow-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-white"}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-white"}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Rendering based on ViewMode */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-4"}>
        <AnimatePresence mode="popLayout">
          {processedVehicles.length > 0 ? (
            processedVehicles.map((v) => (
              <motion.div
                key={v.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={viewMode === "list" ? "w-full" : ""}
              >
                <VehicleCard
                  vehicle={v}
                  viewMode={viewMode === "list" ? "customer-list" : "customer-dashboard"}
                  onRequest={handleRequestUplink}
                  onEdit={null}
                  onDelete={null}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-24 border-2 border-dashed border-white/5 rounded-[3rem] text-center"
            >
              <p className="text-slate-500 font-black italic uppercase tracking-[0.3em]">Query_Result: NULL</p>
              <button onClick={() => { setSearchTerm(""); setSortBy("DEFAULT"); }} className="mt-4 text-indigo-500 text-[10px] font-black underline">CLEAR_DATABASE_QUERY</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomerVehicleBrowser;