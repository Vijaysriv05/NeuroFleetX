import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Icons
import {
  Close as CloseIcon,
  Logout as LogoutIcon,
  Navigation as NavigationIcon,
  Speed as SpeedIcon,
  EvStation as EvStationIcon,
  Engineering as EngineeringIcon,
  Warning as WarningIcon,
  AccountCircle as AccountCircleIcon,
  Radio as RadioIcon,
  DeleteForever as DeleteIcon,
  AddCircleOutline as AddIcon,
  HourglassEmpty as PendingIcon,
  Layers as LayersIcon,
  Circle as CircleIcon,
  MyLocation as PickupIcon,
  Hub as HubIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Assessment as LogsIcon,
  Verified as VerifiedIcon,
  Sync as SyncIcon,
  SettingsInputComponent as TelemetryIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Save as SaveIcon,
  Chat as ChatIcon,
  Send as SendIcon
} from "@mui/icons-material";

// Components & API
import RouteOptimizer from '../components/RouteOptimizer';
import api, { getProfile, updateProfile } from "../api";

const DriverDashboard = () => {
  const navigate = useNavigate();

  // --- UI & NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLocallyCleared, setIsLocallyCleared] = useState(false);

  // --- DATA STATE ---
  const [activeBooking, setActiveBooking] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState({
    username: "", email: "", roleId: "", phone: "", address: ""
  });
  const [globalFeedback, setGlobalFeedback] = useState([]);
  const [maintenanceIssue, setMaintenanceIssue] = useState("");
  const [newFeedbackNotify, setNewFeedbackNotify] = useState(null);
  const lastFeedbackIdRef = useRef(null);

  const [pendingUnits, setPendingUnits] = useState([]);
  const [authorizedUnits, setAuthorizedUnits] = useState([]);

  // --- CHAT & MESSAGE STATE ---
  const [driverMsg, setDriverMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]); // <--- Integrated Chat History
  const quickMsgs = ["I'M ON MY WAY", "ARRIVED AT PICKUP", "TRAFFIC DELAY", "MISSION COMPLETE"];

  const [tripMetrics, setTripMetrics] = useState({
    distance: "0.00",
    duration: "0.0",
    progress: 0,
    velocity: "0",
    energy: 100
  });

  // --- HELPERS ---
  const formatLocation = (name) => {
    if (!name || name === "N/A" || name === "Assigned Depot" || name === "Service Route") return name;
    return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSafeId = useCallback(() => {
    return localStorage.getItem("userId") || "";
  }, []);

  // --- CORE DATA FETCHING ---
  const fetchDriverData = useCallback(async () => {
    const safeId = getSafeId();
    try {
      const localMissionRaw = localStorage.getItem("activeMission");
      let localMission = localMissionRaw ? JSON.parse(localMissionRaw) : null;

      let apiBookings = [];
      if (safeId) {
        const res = await api.get(`/bookings/user/${safeId}`);
        apiBookings = Array.isArray(res.data) ? res.data : [];
      }

      const pending = apiBookings.filter(b => b.status === "PENDING");
      const authorized = apiBookings.filter(b => ["APPROVED", "AUTHORIZED", "TRIP_ACTIVE"].includes(b.status));

      setPendingUnits(pending);
      setAuthorizedUnits(authorized);

      if (!isLocallyCleared) {
        const currentActive = localMission ||
                            authorized.find(b => b.status === "TRIP_ACTIVE") ||
                            authorized.find(b => b.status === "APPROVED") ||
                            authorized.find(b => b.status === "AUTHORIZED") ||
                            pending[0] || null;

        setActiveBooking(currentActive);

        if (currentActive) {
          setTripMetrics(prev => ({
            ...prev,
            distance: currentActive.distance || "0.0",
            duration: currentActive.duration || "0.0",
            progress: currentActive.progress || (currentActive.status === "TRIP_ACTIVE" ? 25 : 0),
            velocity: currentActive.status === "TRIP_ACTIVE" ? (Math.random() * 20 + 40).toFixed(0) : "0",
            energy: currentActive.energy !== undefined ? currentActive.energy : 88
          }));
        }
      }
    } catch (err) {
      console.error("SYNC_FAIL", err);
    } finally {
      setLoading(false);
    }
  }, [getSafeId, isLocallyCleared]);

  const fetchSecondaryData = useCallback(async () => {
    const safeId = getSafeId();
    if (!safeId) return;
    try {
      const [historyRes, logsRes] = await Promise.all([
        api.get(`/driver/trips/history/${safeId}`),
        api.get(`/driver/logs/${safeId}`)
      ]);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
    } catch (err) { console.error("Archive link error"); }
  }, [getSafeId]);

  const fetchIdentity = useCallback(async () => {
    try {
      const res = await getProfile();
      if (res.data) {
        setProfile({
          username: res.data.name || res.data.username || "OPERATOR",
          email: res.data.email || "N/A",
          roleId: res.data.role || "DRIVER",
          phone: res.data.phone || "",
          address: res.data.address || ""
        });
      }
    } catch (err) { console.error("Identity sync fail"); }
  }, []);

  const fetchFeedback = useCallback(async () => {
    try {
      const response = await api.get("/feedback/all");
      const validEntries = response.data || [];
      if (validEntries.length > 0) {
        const latest = validEntries[0];
        if (lastFeedbackIdRef.current !== null && latest.id > lastFeedbackIdRef.current) {
          setNewFeedbackNotify(latest);
          setTimeout(() => setNewFeedbackNotify(null), 6000);
        }
        lastFeedbackIdRef.current = latest.id;
      }
      setGlobalFeedback(validEntries);
    } catch (error) { console.error("Feedback link error"); }
  }, []);

  // --- RECEIVER LOGIC: LISTEN FOR INCOMING SIGNALS ---
  useEffect(() => {
    const handleIncomingSync = (e) => {
      // 1. Logic for mission updates
      if (e.key === "activeMission" && e.newValue) {
        toast.info("NETWORK_ALERT: NEW MISSION ASSIGNED", { icon: <RadioIcon /> });
        setIsLocallyCleared(false);
        fetchDriverData();
      }

      // 2. Logic for Customer Messages
      if (e.key === "customerMessage" && e.newValue) {
        const msg = JSON.parse(e.newValue);

        // Update visual chat history
        setChatHistory(prev => [...prev, { ...msg, type: 'incoming' }]);

        toast.info(`CUSTOMER: ${msg.text}`, {
          position: "top-right",
          autoClose: 5000,
          icon: <ChatIcon className="text-indigo-500" />
        });
      }
    };

    window.addEventListener("storage", handleIncomingSync);
    return () => window.removeEventListener("storage", handleIncomingSync);
  }, [fetchDriverData]);

  // --- ACTIONS ---
  const sendToCustomer = (msgText) => {
    const finalMsg = msgText || driverMsg;
    if (!finalMsg) return;

    const response = {
      text: finalMsg,
      sender: profile.username,
      timestamp: new Date().toISOString(),
      status: "SENT"
    };

    // Update local history for self
    setChatHistory(prev => [...prev, { ...response, type: 'outgoing' }]);

    localStorage.setItem("driverResponse", JSON.stringify(response));
    window.dispatchEvent(new Event("storage"));

    toast.success("UPLINK_SENT");
    setDriverMsg("");
  };

  const handleOpenSyncModal = async () => {
    setIsSyncing(true);
    try {
      const res = await api.get("/vehicles/master");
      setAvailableVehicles((res.data || []).filter(v => v.status === "AVAILABLE"));
      setIsRequestModalOpen(true);
    } catch (err) { toast.error("DATABASE_SYNC_ERROR"); }
    finally { setIsSyncing(false); }
  };

  const handleInitializeSync = async (vehicleId, vehicleName) => {
      setIsSyncing(true);
      try {
          const localData = JSON.parse(localStorage.getItem('activeMission') || "{}");
          const rawId = getSafeId();
          await api.post("/bookings/create", {
              vehicleModel: vehicleName,
              vehicleId: vehicleId.toString(),
              userId: rawId,
              pickupLocation: localData.pickupLocation || "Assigned Depot",
              dropLocation: localData.dropLocation || "Service Route",
              status: "PENDING"
          });
          toast.success(`${vehicleName} SYNC_INITIALIZED`);
          setIsRequestModalOpen(false);
          setIsLocallyCleared(false);
          fetchDriverData();
      } catch (err) { toast.error("SYNC_FAILED"); }
      finally { setIsSyncing(false); }
  };

  const handleCommitProfileChanges = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ phone: profile.phone, address: profile.address });
      toast.success("PROFILE_SYNCHRONIZED");
      setIsEditing(false);
      fetchIdentity();
    } catch (err) {
      toast.error("COMMIT_FAILED");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const localMissionRaw = localStorage.getItem("activeMission");
      if (localMissionRaw) {
          const localMission = JSON.parse(localMissionRaw);
          localMission.status = "TRIP_ACTIVE";
          localStorage.setItem("activeMission", JSON.stringify(localMission));
      }
      await api.put(`/driver/trip/status/${getSafeId()}`);
      sendToCustomer("MISSION_STARTED: EN ROUTE");
      toast.success("TRIP_ACTIVE");
      fetchDriverData();
    } catch (err) { toast.error("PICKUP_LINK_ERROR"); }
  };

  const handleDrop = async () => {
    try {
      await api.put(`/driver/trip/drop/${getSafeId()}`);
      localStorage.removeItem("activeMission");
      sendToCustomer("DESTINATION_REACHED: TRIP_COMPLETE");
      toast.success("MISSION COMPLETE");
      setActiveBooking(null);
      setIsLocallyCleared(true);
      fetchDriverData();
      fetchSecondaryData();
    } catch (err) { toast.error("DROP_SEQUENCE_FAILED"); }
  };

  const handleClearMission = () => {
    localStorage.removeItem("activeMission");
    setActiveBooking(null);
    setIsLocallyCleared(true);
    toast.info("CACHE_PURGED");
  };

  const handleMaintenanceReport = async () => {
    if (!maintenanceIssue.trim()) { toast.warning("REPORT_EMPTY"); return; }
    try {
      await api.post(`/driver/maintenance/${getSafeId()}`, { description: maintenanceIssue, status: "PENDING" });
      toast.success("MAINTENANCE_LOG_SENT");
      setMaintenanceIssue("");
      fetchSecondaryData();
    } catch (err) { toast.error("TRANSMISSION_FAILURE"); }
  };

  const handleTriggerSOS = async () => {
    try {
      await api.post(`/driver/emergency/${getSafeId()}`, {});
      toast.error("SOS_BROADCAST_SENT");
      fetchSecondaryData();
    } catch (err) { toast.error("UPLINK_FAILURE"); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  useEffect(() => {
    fetchDriverData();
    fetchIdentity();
    fetchFeedback();
    fetchSecondaryData();

    const interval = setInterval(() => {
        fetchDriverData();
        fetchFeedback();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchDriverData, fetchIdentity, fetchFeedback, fetchSecondaryData]);

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-black text-indigo-600 animate-pulse tracking-widest uppercase italic">
      <LayersIcon sx={{ fontSize: 50, mb: 2 }} /> Synchronizing_Neural_Link...
    </div>
  );

  const currentStatus = (activeBooking?.status || "idle").toLowerCase();

  return (
    <>
      <ToastContainer theme="dark" position="bottom-right" />

      {/* Incoming Feedback Notifications */}
      <AnimatePresence>
        {newFeedbackNotify && (
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="fixed top-24 right-10 z-[100] bg-[#0f172a] text-white p-6 rounded-3xl shadow-2xl border-l-4 border-indigo-500 w-80">
            <div className="flex items-center gap-3 mb-2">
              <RadioIcon className="text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Incoming_Transmission</span>
            </div>
            <p className="text-xs italic">"{newFeedbackNotify.message || newFeedbackNotify.comment}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-72 bg-[#0f172a] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl">
          <div className="p-8 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg"><LayersIcon /></div>
            <span className="text-2xl font-black tracking-tighter italic">NEUROX</span>
          </div>
          <nav className="flex-1 px-6 space-y-3">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
              { id: 'history', label: 'Trip History', icon: <HistoryIcon fontSize="small" /> },
              { id: 'logs', label: 'System Logs', icon: <LogsIcon fontSize="small" /> }
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                {item.icon} {item.label}
              </button>
            ))}
            <button onClick={() => setIsProfileOpen(true)} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-bold text-sm mt-6 border-t border-slate-800">
              <AccountCircleIcon fontSize="small" /> System Profile
            </button>
          </nav>
          <div className="p-8">
            <button onClick={handleLogout} className="w-full py-4 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white transition-all rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-3 tracking-widest italic shadow-lg"><LogoutIcon sx={{ fontSize: 16 }} /> Terminate Session</button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 ml-72 relative z-10">
          <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-12 sticky top-0 z-40">
            <div className="flex items-center gap-4">
               <CircleIcon sx={{ fontSize: 10 }} className="text-emerald-500 animate-pulse" />
               <h1 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em] italic">System / <span className="text-indigo-600">{activeTab.toUpperCase()}</span></h1>
               {isSyncing && <SyncIcon className="animate-spin text-indigo-600 ml-4" sx={{ fontSize: 14 }} />}
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100"><VerifiedIcon className="text-emerald-500" sx={{ fontSize: 16 }} /><span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Active: {authorizedUnits.length}</span></div>
              <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100"><PendingIcon className="text-amber-500" sx={{ fontSize: 16 }} /><span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Pending: {pendingUnits.length}</span></div>
            </div>
          </header>

          <div className="p-12">
            {activeTab === "dashboard" && (
              <div className="space-y-12">

                {/* MISSION CARD */}
                {activeBooking && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl text-white">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><AssignmentIcon /></div>
                      <h2 className="text-xl font-black uppercase italic tracking-tighter">Current Dispatch Details</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                      <div><label className="text-[9px] font-black text-slate-500 uppercase">Unit_ID</label><p className="text-lg font-black italic">{activeBooking.vehicleModel || "UNIT_01"}</p></div>
                      <div><label className="text-[9px] font-black text-slate-500 uppercase">Origin_Node</label><p className="text-lg font-black italic text-emerald-400">{formatLocation(activeBooking.pickupLocation)}</p></div>
                      <div><label className="text-[9px] font-black text-slate-500 uppercase">Destination_Node</label><p className="text-lg font-black italic text-rose-400">{formatLocation(activeBooking.dropLocation)}</p></div>
                    </div>
                  </motion.div>
                )}

                {/* INTEGRATED COMM LINK (CHAT BOX) */}
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600"><ChatIcon /></div>
                    <h3 className="text-xs font-black text-slate-900 uppercase italic tracking-widest">Comm_Link / Live_Feed</h3>
                  </div>

                  {/* LIVE MESSAGE FEED AREA */}
                  <div className="bg-slate-50 rounded-3xl p-6 mb-6 h-48 overflow-y-auto flex flex-col gap-3 border border-slate-100 shadow-inner">
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center mt-12 opacity-30">
                         <RadioIcon sx={{ fontSize: 30 }} />
                         <p className="text-[10px] font-bold uppercase tracking-widest italic mt-2">No active transmissions...</p>
                      </div>
                    ) : (
                      chatHistory.map((chat, i) => (
                        <div key={i} className={`flex ${chat.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-bold ${
                            chat.type === 'outgoing'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                          }`}>
                            <span className="block opacity-50 text-[8px] mb-1 uppercase">
                              {chat.type === 'outgoing' ? 'You' : 'Customer'}
                            </span>
                            {chat.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* CONTROLS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-wrap gap-2">
                      {quickMsgs.map((m, i) => (
                        <button key={i} onClick={() => sendToCustomer(m)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black hover:bg-indigo-600 hover:text-white transition-all uppercase">{m}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={driverMsg} onChange={(e) => setDriverMsg(e.target.value)} placeholder="TYPE MESSAGE..." className="flex-1 bg-slate-100 border-none p-4 rounded-2xl text-xs font-bold outline-none" />
                      <button onClick={() => sendToCustomer()} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg transition-transform active:scale-90"><SendIcon fontSize="small" /></button>
                    </div>
                  </div>
                </div>

                {/* STATUS BAR */}
                <div className="bg-[#0f172a] p-12 rounded-[3.5rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl"><NavigationIcon /></div>
                    <h2 className="text-5xl font-black italic uppercase">{(isLocallyCleared || !activeBooking) ? "STANDBY" : (activeBooking?.vehicleModel || "ACTIVE")}</h2>
                  </div>
                  <div className="flex gap-4 relative z-10">
                    {!activeBooking && <button onClick={handleOpenSyncModal} className="bg-indigo-600 px-10 py-5 rounded-3xl font-black text-xs hover:bg-indigo-500 shadow-xl"><AddIcon /> INITIALIZE_SYNC</button>}
                    {(currentStatus === "approved" || currentStatus === "authorized" || currentStatus === "pending") && <button onClick={handleUpdateStatus} className="bg-emerald-600 px-10 py-5 rounded-3xl font-black text-xs hover:bg-emerald-500 shadow-xl"><PickupIcon /> START_MISSION</button>}
                    {currentStatus === "trip_active" && <button onClick={handleDrop} className="bg-white text-slate-900 px-10 py-5 rounded-3xl font-black text-xs hover:bg-slate-100 shadow-xl">COMPLETE_TRIP</button>}
                    {activeBooking && <button onClick={handleClearMission} className="p-5 bg-slate-800 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white shadow-xl"><DeleteIcon /></button>}
                  </div>
                </div>

                {/* MAP */}
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-t-8 border-[#4ade80]">
                  <h2 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-6 italic">Neural_Path_Finder_V3</h2>
                  {activeBooking ? <RouteOptimizer key={activeBooking.id} booking={activeBooking} /> : <div className="h-[400px] bg-slate-50 rounded-3xl flex items-center justify-center font-black text-slate-400 italic uppercase text-xs tracking-widest">SYSTEM_AWAITING_ACTIVE_UPLINK</div>}
                </div>

                {/* TELEMETRY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-2xl">
                    <h3 className="text-xs font-black text-indigo-400 uppercase mb-8 flex items-center gap-3 italic"><TelemetryIcon /> LIVE_TELEMETRY_STREAM</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                        <div className="flex justify-between items-center mb-4"><SpeedIcon className="text-indigo-400" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Velocity</span></div>
                        <p className="text-3xl font-black italic">{tripMetrics.velocity}<span className="text-xs ml-1 text-slate-500 uppercase">km/h</span></p>
                      </div>
                      <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                        <div className="flex justify-between items-center mb-4"><EvStationIcon className="text-emerald-400" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Charge</span></div>
                        <p className="text-3xl font-black italic">{tripMetrics.energy}<span className="text-xs ml-1 text-slate-500">%</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                    <h3 className="text-xs font-black text-slate-900 uppercase mb-8 flex items-center gap-3 italic"><EngineeringIcon className="text-indigo-600" /> CORE_HEALTH_DIAGNOSTICS</h3>
                    <div className="space-y-6">
                      {['Navigation_Relay', 'Encryption_Mesh', 'Propulsion_Sync'].map((label, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-emerald-500 uppercase">Optimal</span>
                            <div className="w-12 h-1 bg-emerald-100 rounded-full overflow-hidden"><div className="w-full h-full bg-emerald-500" /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FEEDBACK & REPORTING */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] shadow-xl">
                    <h3 className="text-xs font-black text-indigo-600 uppercase mb-8 flex items-center gap-3 italic"><HubIcon /> Network_Feedback_Logs</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                      {globalFeedback.length > 0 ? globalFeedback.map((f, i) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-2xl italic text-sm font-bold text-slate-600 border-l-4 border-slate-200">"{f.message || f.comment}"</div>
                      )) : <p className="text-slate-300 font-black italic text-xs uppercase text-center py-10">No_Incoming_Signals</p>}
                    </div>
                  </div>
                  <div className="lg:col-span-5 bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-2xl">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2"><EngineeringIcon sx={{fontSize: 14}}/> Anomaly_Report</h4>
                    <textarea value={maintenanceIssue} onChange={(e) => setMaintenanceIssue(e.target.value)} placeholder="LOG SYSTEM ERROR..." className="w-full h-24 bg-slate-800 rounded-2xl p-4 text-xs font-bold outline-none mb-4 border border-slate-700 focus:border-indigo-500 transition-all resize-none" />
                    <button onClick={handleMaintenanceReport} className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase italic transition-all hover:bg-indigo-500 shadow-lg">Push_Log_to_Core</button>
                    <div className="mt-8 pt-8 border-t border-slate-800">
                      <button onClick={handleTriggerSOS} className="w-full py-4 bg-rose-600 rounded-2xl font-black text-[10px] uppercase italic flex items-center justify-center gap-2 hover:bg-rose-500 shadow-lg shadow-rose-900/20"><WarningIcon sx={{fontSize: 16}}/> Emergency_SOS</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-6">
                <h3 className="text-xs font-black text-indigo-600 uppercase mb-4 italic tracking-widest">Deployment_Archive</h3>
                {history.length > 0 ? history.map((trip, idx) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-lg flex items-center justify-between border-l-8 border-emerald-500 transition-all hover:scale-[1.01]">
                    <h4 className="text-lg font-black italic uppercase">{formatLocation(trip.pickupLocation)} → {formatLocation(trip.dropLocation)}</h4>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(trip.updatedAt).toLocaleDateString()}</p>
                      <p className="text-indigo-600 font-black italic text-xs">{trip.distance || '4.2'} KM_TRANSFERRED</p>
                    </div>
                  </motion.div>
                )) : <div className="p-20 text-center font-black text-slate-300 italic uppercase">No_Archive_Found</div>}
              </div>
            )}

            {activeTab === "logs" && (
              <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-2xl">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic mb-8">System_Transmission_Logs</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-hide">
                  {logs.length > 0 ? logs.map((log, idx) => (
                    <div key={idx} className="p-6 bg-slate-800/50 rounded-2xl flex justify-between items-center border border-slate-700">
                      <p className="text-sm font-bold italic">{log.description}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  )) : <div className="p-20 text-center text-slate-600 font-black italic uppercase">Log_Stream_Empty</div>}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* VEHICLE SYNC MODAL */}
        <AnimatePresence>
          {isRequestModalOpen && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-xl">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-xl rounded-[3rem] p-12 relative shadow-4xl">
                  <button onClick={() => setIsRequestModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><CloseIcon /></button>
                  <h2 className="text-3xl font-black italic text-slate-900 uppercase mb-8 tracking-tighter">Node_Discovery</h2>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                    {availableVehicles.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100">
                         <span className="text-slate-900 font-black uppercase italic text-lg">{v.model}</span>
                         <button onClick={() => handleInitializeSync(v.id, v.model)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase shadow-lg hover:bg-indigo-500 transition-all">Link_Asset</button>
                      </div>
                    ))}
                  </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PROFILE SIDE DRAWER */}
        <AnimatePresence>
          {isProfileOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfileOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000]" />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-[1001] shadow-4xl p-12 overflow-y-auto">
                 <div className="flex justify-between items-center mb-12">
                   <h2 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Profile_Sync</h2>
                   <button onClick={() => setIsProfileOpen(false)}><CloseIcon /></button>
                 </div>
                 <div className="space-y-8">
                   <div className="space-y-6">
                     <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Username</label><input disabled={true} value={profile.username} className="w-full bg-slate-100 p-5 rounded-2xl font-bold border-none text-slate-400" /></div>
                     <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Phone_Uplink</label><input disabled={!isEditing} value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-none outline-indigo-600" /></div>
                     <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Station_Address</label><input disabled={!isEditing} value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-none outline-indigo-600" /></div>
                   </div>
                   {isEditing ? (
                     <button onClick={handleCommitProfileChanges} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg">
                       <SaveIcon fontSize="small"/> {isSaving ? "Syncing..." : "Commit_Changes"}
                     </button>
                   ) : (
                     <button onClick={() => setIsEditing(true)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Unlock_Records</button>
                   )}
                 </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default DriverDashboard;