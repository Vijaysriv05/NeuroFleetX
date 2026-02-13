import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import api from "../api";

const MaintenanceList = ({ onServiceComplete }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * MEMOIZED DATA FETCH
   * Existing logic: Filter Nodes >= 1000km OR CRITICAL condition
   */
  const fetchMaintenanceTasks = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get("/vehicles/master");
      const vehicles = res.data || [];

      // Logic: Distance >= 1000 OR Condition is CRITICAL
      const criticalVehicles = vehicles.filter(v =>
        (Number(v.totalDistance) >= 1000) || v.vehicleCondition === "CRITICAL"
      );
      setTasks(criticalVehicles);
    } catch (err) {
      console.error("Maintenance Fetch Error:", err);
      toast.error("MAINTENANCE_LOG_FETCH_FAILED");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceTasks();
    // Auto-refresh the queue every 10 seconds to catch telemetry changes
    const interval = setInterval(() => fetchMaintenanceTasks(true), 10000);
    return () => clearInterval(interval);
  }, [fetchMaintenanceTasks]);

  /**
   * RECALIBRATION PROTOCOL
   * Resets vehicle on backend and refreshes parent dashboard stats
   */
  const handleResolveTask = async (vehicleId) => {
    try {
      // Logic: Authorize service (resets KM to 0 on backend)
      await api.put(`/vehicles/authorize-service/${vehicleId}`);

      toast.success(`NODE_${vehicleId}_RECALIBRATED_SUCCESSFULLY`);

      // Immediate refresh of local list
      await fetchMaintenanceTasks(true);

      // Trigger Parent Dashboard Sync (Updates stats cards)
      if (onServiceComplete) {
        onServiceComplete();
      }
    } catch (err) {
      console.error("Calibration Error:", err);
      toast.error("CALIBRATION_FAILED");
    }
  };

  const manualRefresh = () => {
    setIsRefreshing(true);
    fetchMaintenanceTasks();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">
            Service_<span className="text-indigo-500">Queue</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
            Active Maintenance Protocols & Recalibration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={manualRefresh}
            className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
            title="Manual Sync"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-xl flex items-center gap-3">
            <Clock size={16} className="text-amber-500 animate-pulse" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
              {tasks.length} Nodes Pending
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Scanning_Nodes...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-[#0d1117] border border-dashed border-white/10 rounded-[3rem] p-20 text-center shadow-2xl">
          <div className="relative inline-block mb-6">
            <ShieldCheck size={64} className="text-emerald-500 opacity-20" />
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
          </div>
          <p className="text-white font-black uppercase italic tracking-widest text-sm mb-2">Fleet_Status_Optimal</p>
          <p className="text-slate-600 font-bold uppercase text-[9px] tracking-widest">No Maintenance Protocols Required at this depth</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-[#0d1117] border border-white/5 p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden"
            >
              {/* Decorative background glow for critical nodes */}
              {task.vehicleCondition === "CRITICAL" && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl -z-10" />
              )}

              <div className="flex items-center gap-8 w-full">
                <div className={`h-20 w-20 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                  task.vehicleCondition === "CRITICAL"
                    ? 'bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <AlertTriangle size={32} className={task.vehicleCondition === "CRITICAL" ? "animate-pulse" : ""} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-black italic text-white uppercase tracking-tighter">
                      Node_{task.id}
                    </h4>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-slate-500 uppercase">
                      {task.model}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Usage_Telemetry</p>
                      <p className={`text-xs font-black uppercase italic ${Number(task.totalDistance) >= 1000 ? 'text-red-500' : 'text-white'}`}>
                        {task.totalDistance} <span className="text-[10px]">KM</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Health_Status</p>
                      <p className={`text-xs font-black uppercase italic ${task.vehicleCondition === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>
                        {task.vehicleCondition}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Location_Tag</p>
                      <p className="text-xs font-black uppercase italic text-slate-400">
                        {task.location || "Sector_7_Hub"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleResolveTask(task.id)}
                className="w-full lg:w-auto group/btn relative bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-black px-10 py-5 rounded-2xl font-black uppercase italic text-xs transition-all flex items-center justify-center gap-3 overflow-hidden shadow-lg hover:shadow-emerald-500/20"
              >
                <CheckCircle2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                <span className="relative z-10">Authorize_Calibration</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;