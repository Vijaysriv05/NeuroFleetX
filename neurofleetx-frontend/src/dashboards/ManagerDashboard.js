import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity, MapPin, Wrench, Bell,
  Zap, X, LogOut,
  MessageSquare, Trash2, Radio, CheckCircle,
  UserCheck, Navigation, Flag, Target, Save, ClipboardList, Search, AlertTriangle, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api, { getProfile, updateProfile } from "../api";
import LoadOptimizer from '../components/LoadOptimizer';

// COMPONENTS
import VehicleGrid from "../components/VehicleGrid";
import LiveMap from "../components/LiveMap";
import MaintenanceList from "../components/MaintenanceList";
import MaintenanceHistory from "../components/MaintenanceHistory";

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Map focus and Demand states
  const [selectedDemandZone, setSelectedDemandZone] = useState(null);
  const [mapFocusNode, setMapFocusNode] = useState(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Mock data for Load Optimizer
  const fleetData = [
      { id: 1, name: 'Truck_01', loadPercentage: 85 },
      { id: 2, name: 'Van_04', loadPercentage: 40 },
      { id: 3, name: 'Truck_09', loadPercentage: 92 },
      { id: 4, name: 'Bike_02', loadPercentage: 10 }
  ];

  // Feedback & Notifications
  const [globalFeedback, setGlobalFeedback] = useState([]);
  const [newFeedbackNotify, setNewFeedbackNotify] = useState(null);
  const lastFeedbackIdRef = useRef(null);

  // Fleet & Requests State
  const [masterFleet, setMasterFleet] = useState([]);
  const [driverRequests, setDriverRequests] = useState([]);

  // Telemetry Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [simData, setSimData] = useState({
    status: "AVAILABLE",
    vehicleCondition: "OPTIMAL",
    latitude: 20.5937,
    longitude: 78.9629,
    totalDistance: 0
  });

  const [stats, setStats] = useState({ activeUnits: 0, pendingService: 0, highDemandSectors: 0 });
  const [alerts, setAlerts] = useState([]);
  const [demandZones, setDemandZones] = useState([]);

  const [profile, setProfile] = useState({
    name: "Loading...",
    email: "",
    role: "Manager",
    phone: "",
    address: "Sector 7, Neo-Chennai Hub, IN"
  });

  // --- 1. IDENTITY FETCH ---
  const fetchIdentity = useCallback(async () => {
    try {
      const res = await getProfile();
      if (res.data) {
        setProfile({
          name: res.data.name || "Operator",
          email: res.data.email || "N/A",
          role: res.data.role || res.data.roleId || "Manager",
          phone: res.data.phone || "",
          address: res.data.address || "Sector 7, Neo-Chennai Hub, IN"
        });
      }
    } catch (err) {
      console.error("Identity Sync Error:", err);
    }
  }, []);

  // --- 2. STATS & FLEET SYNC ---
  const fetchManagerStats = useCallback(async () => {
    try {
      const statsRes = await api.get("/vehicles/stats");
      const activeUnitsCount = statsRes.data.activeTrips || 0;

      const res = await api.get("/vehicles/master");
      const vehicles = res.data || [];
      setMasterFleet(vehicles);

      const serviceRequired = vehicles.filter(v =>
        (Number(v.totalDistance) >= 1000) || v.vehicleCondition === "CRITICAL"
      );

      const sectorTargets = { "DOWNTOWN": 5, "AIRPORT": 4, "INDUSTRIAL": 3 };
      const sectorCurrent = vehicles.reduce((acc, v) => {
        const loc = v.location?.toUpperCase() || "UNSET";
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {});

      const highDemandAreas = Object.keys(sectorTargets).filter(zone => (sectorCurrent[zone] || 0) < sectorTargets[zone]);

      setDemandZones(highDemandAreas);
      setStats({
        activeUnits: activeUnitsCount,
        pendingService: serviceRequired.length,
        highDemandSectors: highDemandAreas.length
      });

      setAlerts(serviceRequired.map(v =>
        v.vehicleCondition === "CRITICAL"
          ? `SOS: Node ${v.id} (${v.model}) - EMERGENCY`
          : `CRITICAL: Node ${v.id} (${v.model}) threshold breach at ${v.totalDistance}km.`
      ));
    } catch (err) {
      console.error("Fleet Sync Error:", err);
    }
  }, []);

  const handleTrackVehicle = (vehicleModel) => {
    const vehicle = masterFleet.find(v => v.model === vehicleModel);
    if (vehicle) {
      setMapFocusNode({
        lat: vehicle.latitude || 20.5937,
        lng: vehicle.longitude || 78.9629,
        id: vehicle.id,
        model: vehicle.model
      });
      setActiveTab('map');
      toast.info(`LINK_ESTABLISHED: TRACKING ${vehicleModel}`);
    } else {
      toast.error("NODE_OFFLINE: UNABLE_TO_LOCATE_UNIT");
    }
  };

  const handleResolveSOS = async (vehicleId) => {
    try {
      await api.put(`/customer/vehicles/${vehicleId}`, {
        vehicleCondition: "OPTIMAL",
        status: "AVAILABLE"
      });
      toast.success("EMERGENCY_CLEARED: NODE_RESTORED");
      fetchManagerStats();
    } catch (err) {
      toast.error("RESOLVE_FAILED: DATABASE_LINK_ERROR");
    }
  };

  const fetchDriverRequests = useCallback(async () => {
    try {
      const res = await api.get("/manager/driver-requests");
      setDriverRequests(res.data || []);
    } catch (err) {
      console.error("Driver Assignment Fetch Error:", err);
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    try {
      const response = await api.get("/feedback/all");
      const validEntries = (response.data || []).filter(item => item.id && item.message);

      if (validEntries.length > 0) {
        const latest = validEntries.reduce((prev, curr) => (prev.id > curr.id ? prev : curr));

        if (lastFeedbackIdRef.current === null) {
          lastFeedbackIdRef.current = latest.id;
        } else if (latest.id > lastFeedbackIdRef.current) {
          setNewFeedbackNotify(latest);
          lastFeedbackIdRef.current = latest.id;
          setTimeout(() => setNewFeedbackNotify(null), 8000);
        }
      }
      setGlobalFeedback(validEntries.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Feedback sync failure:", error);
    }
  }, []);

  const handleDeleteFeedback = async (id) => {
    try {
      await api.delete(`/feedback/${id}`);
      toast.success("FEEDBACK_NODE_PURGED");
      fetchFeedback();
    } catch (err) {
      toast.error("PURGE_SYNC_ERROR");
    }
  };

  const handleExecuteSync = async () => {
    try {
      setIsSaving(true);
      const res = await api.post("/redistribute", {
        fromSector: "INDUSTRIAL",
        toSector: "DOWNTOWN",
        unitCount: 5
      });
      toast.success(`NEURAL_SYNC: ${res.data.movedUnits || 5} UNITS RELOCATED`);
      fetchManagerStats();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      toast.error("SYNC_INTERRUPTED: UPLINK_TIMEOUT");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveDriverRequest = async (requestId) => {
    try {
      await api.put(`/manager/approve-driver/${requestId}`);
      toast.success("DRIVER_UPLINK_AUTHORIZED");
      fetchDriverRequests();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      toast.error("AUTHORIZATION_FAILED");
    }
  };

  const handleDeployToZone = (zone) => {
    setSelectedDemandZone(zone);
    setMapFocusNode(null);
    setActiveTab('map');
  };

  useEffect(() => {
    fetchManagerStats();
    fetchIdentity();
    fetchFeedback();
    fetchDriverRequests();
    const interval = setInterval(() => {
      fetchManagerStats();
      fetchFeedback();
      fetchDriverRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchManagerStats, fetchIdentity, fetchFeedback, fetchDriverRequests]);

  const handleEditVehicle = (vehicle) => {
    setSelectedUnit(vehicle);
    setSimData({
      status: vehicle.status || "AVAILABLE",
      vehicleCondition: vehicle.vehicleCondition || "OPTIMAL",
      latitude: vehicle.latitude || 20.5937,
      longitude: vehicle.longitude || 78.9629,
      totalDistance: vehicle.totalDistance || 0
    });
    setIsSimulatorOpen(true);
  };

  const handleSimUpdate = async () => {
    try {
      await api.put(`/customer/vehicles/${selectedUnit.id}`, simData);
      toast.success("TELEMETRY_INJECTED");
      setIsSimulatorOpen(false);
      setRefreshKey(prev => prev + 1);
      fetchManagerStats();
    } catch (err) {
      toast.error("SYNC_FAILED");
    }
  };

  const handleCommitSync = async () => {
    try {
      setIsSaving(true);
      await updateProfile(profile);
      toast.success("IDENTITY_UPDATED");
      setIsEditing(false);
      fetchIdentity();
    } catch (err) {
      toast.error("UPDATE_FAILED");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden font-sans text-left">
      <ToastContainer theme="colored" />

      {/* --- NOTIFICATION SNACKBAR --- */}
      <AnimatePresence>
        {newFeedbackNotify && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 right-10 z-[9999] bg-[#1B1E2F] text-white p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-indigo-500/30"
          >
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Incoming Intel</p>
              <p className="text-sm font-medium italic">"{newFeedbackNotify.message}"</p>
            </div>
            <button onClick={() => setNewFeedbackNotify(null)} className="ml-4 p-2 hover:bg-white/10 rounded-lg">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#1B1E2F] flex flex-col p-6 z-50 shadow-2xl">
        <div className="mb-12 flex items-center gap-3 px-2">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Activity size={24} className="text-white" />
          </div>
          <span className="text-xl font-black italic uppercase text-white tracking-tighter">NeuroFleet</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', label: 'Dashboard', icon: Activity },
            { id: 'fleet', label: 'Fleet Grid', icon: Zap },
            { id: 'map', label: 'Live Map', icon: MapPin },
            { id: 'service', label: 'Maintenance', icon: Wrench },
            { id: 'history', label: 'Log History', icon: ClipboardList },
            { id: 'feedback', label: 'Feedback', icon: MessageSquare },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedDemandZone(null); setMapFocusNode(null); }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={20} />
              <span className="font-black uppercase italic text-[11px] tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={() => setIsProfileOpen(true)} className="mt-auto flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-left">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black">{profile.name?.charAt(0)}</div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-white uppercase truncate">{profile.name}</p>
            <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Operator Core</p>
          </div>
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <div className="p-8 lg:p-12">
          <header className="flex justify-between items-center mb-12 text-left">
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Manager / System Control</p>
              <h1 className="text-4xl font-black text-[#1B1E2F] uppercase italic tracking-tighter">OPERATIONS <span className="text-indigo-600">_PORTAL</span></h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className={`p-4 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all relative ${alerts.some(a => a.includes("SOS")) ? 'text-red-600' : 'text-slate-400'}`}
              >
                <Bell size={20} className={alerts.length > 0 ? "animate-bounce" : ""} />
                {alerts.length > 0 && <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-red-600 rounded-full border-2 border-white" />}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div onClick={() => setActiveTab('fleet')} className="cursor-pointer bg-white p-8 rounded-[2.5rem] border-l-[12px] border-indigo-600 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between h-48">
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-indigo-600 font-black tracking-widest uppercase">Active Nodes</p>
                <Zap size={20} className="text-indigo-600" />
              </div>
              <p className="text-7xl font-black italic text-[#1B1E2F]">{stats.activeUnits}</p>
            </div>

            <div onClick={() => setActiveTab('service')} className="cursor-pointer bg-white p-8 rounded-[2.5rem] border-l-[12px] border-amber-500 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between h-48">
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-amber-500 font-black tracking-widest uppercase">Service Pending</p>
                <Wrench size={20} className="text-amber-500" />
              </div>
              <p className="text-7xl font-black italic text-[#1B1E2F]">{stats.pendingService}</p>
            </div>

            <div onClick={() => setActiveTab('map')} className="cursor-pointer bg-white p-8 rounded-[2.5rem] border-l-[12px] border-emerald-500 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between h-48">
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-emerald-500 font-black tracking-widest uppercase">Demand Sectors</p>
                <MapPin size={20} className="text-emerald-500" />
              </div>
              <p className="text-7xl font-black italic text-[#1B1E2F]">{stats.highDemandSectors}</p>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* TOP SECTION: FLEET & SIDE WIDGETS */}
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3 text-left">
                      <ClipboardList className="text-indigo-600" />
                      <h3 className="text-xl font-black uppercase italic text-[#1B1E2F]">Fleet_Sync_Grid</h3>
                    </div>
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Search Node..." className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-indigo-600 outline-none w-64 transition-all" />
                    </div>
                  </div>
                  <VehicleGrid key={refreshKey} onSimulate={handleEditVehicle} onRefreshStats={fetchManagerStats} role="manager" />
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                  {/* Driver Missions Widget */}
                  <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm text-left">
                    <h3 className="text-xs font-black uppercase text-indigo-600 mb-6 flex items-center gap-2 tracking-widest italic"><UserCheck size={16}/> Incoming Missions</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {driverRequests.map((req, i) => (
                        <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] hover:border-indigo-200 transition-all group">
                          <div className="flex justify-between items-center mb-3">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">REQ_{req.id}</span>
                              <div className="flex gap-2 text-indigo-400">
                                  <Flag size={12} className="group-hover:animate-bounce" />
                                  <Navigation size={12}/>
                              </div>
                          </div>
                          <p className="text-sm font-black text-[#1B1E2F] uppercase italic">{req.driverName}</p>
                          <p className="text-[10px] text-slate-500 font-bold mb-4">{req.vehicleModel}</p>
                          {req.status === 'pending' ? (
                            <button onClick={() => handleApproveDriverRequest(req.id)} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-transform active:scale-95">
                              <CheckCircle size={14} /> Approve Authorization
                            </button>
                          ) : (
                            <button onClick={() => handleTrackVehicle(req.vehicleModel)} className="w-full py-3 bg-[#1B1E2F] text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
                               <Target size={14}/> Tracking Established
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SOS Alert Widget */}
                  <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden ring-2 ring-red-500/20 text-left">
                      <h3 className="text-xs font-black uppercase text-red-600 mb-6 flex items-center gap-2 tracking-widest italic">
                          <AlertTriangle size={16}/> Critical_SOS_Packets
                      </h3>
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {masterFleet.filter(v => v.vehicleCondition === "CRITICAL").length > 0 ? (
                              masterFleet.filter(v => v.vehicleCondition === "CRITICAL").map((v, i) => (
                                  <div key={i} className="bg-red-50 border border-red-100 rounded-[1.5rem] p-4">
                                      <div className="mb-2">
                                          <p className="text-[10px] font-black text-red-600 uppercase italic">NODE_{v.id}: {v.model}</p>
                                          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">LAST_LOCATION: {v.location || 'CHENNAI'}</p>
                                      </div>
                                      <div className="flex gap-2 mt-4">
                                          <button onClick={() => handleTrackVehicle(v.model)} className="flex-1 bg-red-500 text-white text-[9px] font-black py-2 rounded-lg hover:bg-red-600 transition-all uppercase">Pull_Map</button>
                                          <button onClick={() => handleResolveSOS(v.id)} className="flex-1 bg-emerald-500 text-white text-[9px] font-black py-2 rounded-lg hover:bg-emerald-600 transition-all uppercase flex items-center justify-center gap-1"><CheckCircle size={10}/> Clear_SOS</button>
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <p className="text-[9px] text-center text-slate-400 font-black uppercase">No Emergency Signals</p>
                          )}
                      </div>
                  </div>

                  {/* Neural Allocations Widget (USES demandZones and handleDeployToZone) */}
                  <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm text-left">
                    <h3 className="text-xs font-black uppercase text-emerald-600 mb-6 flex items-center gap-2 tracking-widest italic"><MapPin size={16}/> Neural Allocations</h3>
                    <div className="space-y-3">
                      {demandZones.length > 0 ? (
                        demandZones.map((zone, i) => (
                          <div key={i} className="p-4 bg-emerald-50 rounded-2xl flex justify-between items-center border border-emerald-100">
                             <span className="text-[10px] font-black text-emerald-600 uppercase italic tracking-wider">{zone}</span>
                             <button onClick={() => handleDeployToZone(zone)} className="text-[9px] font-black bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all">
                                <Target size={12} /> Deploy
                             </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[9px] text-center text-slate-400 font-black uppercase">Grid Balanced</p>
                      )}
                    </div>
                  </div>

                  {/* Neural Sync Execution Widget */}
                  <div className="bg-[#1B1E2F] p-8 rounded-[2.5rem] text-white relative overflow-hidden text-left">
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-black uppercase text-indigo-400 mb-6 flex items-center gap-2 italic"><Radio size={14} className="animate-pulse" /> Neural_Sync_Relocation</h3>
                      <div className="mb-4 text-left">
                          <p className="text-[9px] text-slate-400 mb-1">System recommends shifting <span className="text-indigo-400 font-black">5 units</span> for coverage optimization.</p>
                      </div>
                      <button onClick={handleExecuteSync} disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase italic text-[11px] transition-all hover:bg-indigo-500 shadow-xl shadow-indigo-900/50">
                        {isSaving ? "Syncing Grid..." : "Execute Sync"}
                      </button>
                    </div>
                    <Radio size={180} className="absolute -right-10 -bottom-10 text-white opacity-[0.03]" />
                  </div>
                </div>
              </div>

              {/* BOTTOM SECTION: AI LOAD BALANCER ALONE */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                 <div className="flex items-center gap-3 mb-6">
                    <Zap className="text-indigo-600" />
                    <h3 className="text-xl font-black uppercase italic text-[#1B1E2F]">AI_Load_Balanced_Optimization</h3>
                 </div>
                 <LoadOptimizer vehicles={fleetData} />
              </div>
            </div>
          )}

          {/* TAB CONTENT MAPPING */}
          {activeTab === 'fleet' && <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm"><VehicleGrid key={refreshKey} onSimulate={handleEditVehicle} onRefreshStats={fetchManagerStats} role="manager" /></div>}
          {activeTab === 'map' && <div className="h-[75vh] rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm"><LiveMap targetZone={selectedDemandZone} focusNode={mapFocusNode} /></div>}
          {activeTab === 'service' && <MaintenanceList onServiceComplete={fetchManagerStats} />}
          {activeTab === 'history' && <MaintenanceHistory />}
          {activeTab === 'feedback' && (
            <div className="max-w-4xl mx-auto space-y-4 text-left">
              <h2 className="text-3xl font-black uppercase italic text-[#1B1E2F] mb-12">System_Feedback_Log</h2>
              {globalFeedback.map((f, i) => (
                <div key={i} className="bg-white border border-slate-200 p-8 rounded-[2rem] flex justify-between items-center group shadow-sm hover:border-indigo-400 transition-all">
                  <div>
                    <span className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.2em]">{f.operatorName}</span>
                    <p className="text-base text-slate-700 italic mt-2 font-medium">"{f.message}"</p>
                  </div>
                  <button onClick={() => handleDeleteFeedback(f.id)} className="p-3 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={24} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- MODALS --- */}
        <AnimatePresence>
          {isAlertsOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-28 right-12 w-96 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl z-[100] text-left">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black uppercase text-slate-400 tracking-widest italic">System_Alert_Feed</span>
                <X size={20} className="cursor-pointer hover:text-red-500" onClick={() => setIsAlertsOpen(false)} />
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {alerts.map((alert, i) => (
                  <div key={i} className={`p-4 rounded-2xl text-[11px] font-bold border-l-4 ${alert.includes("SOS") ? "bg-red-50 border-red-500 text-red-700" : "bg-amber-50 border-amber-500 text-amber-700"}`}>
                    {alert}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- TELEMETRY MODAL --- */}
      <AnimatePresence>
        {isSimulatorOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#1B1E2F]/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-12 rounded-[3.5rem] w-full max-w-md shadow-2xl border border-white/20 text-left">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black uppercase text-[#1B1E2F] italic tracking-tighter">Core_Telemetry_Inject</h3>
                <X size={24} className="cursor-pointer text-slate-300 hover:text-[#1B1E2F] transition-all" onClick={() => setIsSimulatorOpen(false)} />
              </div>
              <select value={simData.vehicleCondition} onChange={(e) => setSimData({ ...simData, vehicleCondition: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-6 rounded-3xl text-xs font-black mb-8 outline-none">
                 <option value="OPTIMAL">OPTIMAL_SYNC</option>
                 <option value="CRITICAL">EMERGENCY_SOS_OVERRIDE</option>
              </select>
              <button onClick={handleSimUpdate} className="w-full py-6 bg-indigo-600 hover:bg-[#1B1E2F] text-white rounded-[2rem] font-black uppercase text-[11px] italic transition-all shadow-xl flex items-center justify-center gap-2">
                <Save size={18} /> Update_Core_System
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- IDENTITY PROFILE SLIDEOUT --- */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfileOpen(false)} className="fixed inset-0 bg-[#1B1E2F]/80 backdrop-blur-xl z-[6000]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[6001] p-12 flex flex-col shadow-2xl text-left">
              <div className="flex justify-between items-center mb-20">
                <span className="font-black italic uppercase tracking-tighter text-3xl text-[#1B1E2F]">IDENTITY<span className="text-indigo-600">_CORE</span></span>
                <button onClick={() => setIsProfileOpen(false)} className="h-12 w-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
                    <X size={28} />
                </button>
              </div>
              <div className="flex-1 space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Operator Handle</label>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-[10px] font-black uppercase text-indigo-600 hover:underline">
                        {isEditing ? "Lock_Fields" : "Unlock_Identity"}
                    </button>
                  </div>
                  <input
                    disabled={!isEditing}
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className={`w-full bg-slate-50 border-2 p-6 rounded-[2rem] text-[#1B1E2F] font-black text-lg outline-none transition-all ${isEditing ? 'border-indigo-600 shadow-lg' : 'border-slate-100 cursor-not-allowed'}`}
                  />
                </div>

                {isEditing && (
                  <button
                    onClick={handleCommitSync}
                    disabled={isSaving}
                    className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-700 transition-all"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Sync_Identity_Node
                  </button>
                )}

                <div className="pt-12">
                   <button onClick={handleLogout} className="w-full flex items-center justify-center gap-4 p-6 bg-red-50 text-red-600 rounded-[2rem] font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all">
                      <LogOut size={20}/> Terminate_Session
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;