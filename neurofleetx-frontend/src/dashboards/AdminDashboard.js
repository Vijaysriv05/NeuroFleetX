import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminHeatMap from '../components/AdminHeatMap';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// API and Components
import api, { getProfile } from "../api";
import VehicleGrid from "../components/VehicleGrid";
import AddVehicle from "../components/AddVehicle";
import VehicleCard from "../components/VehicleCard";

// Material Icons
import {
  Dashboard as DashIcon,
  People as PeopleIcon,
  VerifiedUser as VerifiedIcon,
  History as LogIcon,
  RateReview as FeedbackIcon,
  Logout as LogoutIcon,
  Autorenew as RefreshIcon,
  Hub as HubIcon,
  DirectionsCar as DirectionsCarIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Sensors as SensorsIcon,
  Timeline as TimelineIcon,
  Circle as CircleIcon,
  Layers as LayersIcon,
  Search as SearchIcon,
  Star as StarIcon,
  Storage as StorageIcon,
  RssFeed as FeedIcon,
  AccountCircle as AccountCircleIcon,
  Badge as BadgeIcon,
  DeleteOutline as DeleteIcon,
  NotificationsActive as NotifyIcon,
  Block as BlockIcon,
  Undo as UndoIcon,
  ExitToApp as AuthorizeIcon
} from "@mui/icons-material";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem('token');
  const lastFeedbackIdRef = useRef(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [newFeedbackNotify, setNewFeedbackNotify] = useState(null);
  const [mobilityData, setMobilityData] = useState([]);

  // DATA STATE
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [globalFeedback, setGlobalFeedback] = useState([]);

  // PROFILE STATE
  const [profile, setProfile] = useState({ name: "Admin", role: "Operator", email: "", phone: "", address: "" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [stats, setStats] = useState({
    fleetTotal: 0,
    activeTrips: 0,
    systemLoad: 18,
    iotStatus: "ONLINE"
  });

  const [graphData, setGraphData] = useState([
    { time: '18:00', load: 15 },
    { time: '19:00', load: 22 },
    { time: '20:00', load: 18 },
    { time: '21:00', load: 25 },
    { time: '22:00', load: 21 },
    { time: '23:00', load: 28 },
  ]);

  // MAIN FETCH FUNCTION
  const fetchEverything = useCallback(async () => {
    if (!adminToken) return;
    try {
      const profileRes = await getProfile();
      if (profileRes.data) {
        setProfile({
          name: profileRes.data.name || "Admin",
          role: profileRes.data.roleId || "ADMIN",
          email: profileRes.data.email || "",
          phone: profileRes.data.phone || "",
          address: profileRes.data.address || ""
        });
      }

      const [statsRes, allU, pendU, rejU, pendD, pendV, logsRes, feedRes, fleetRes] = await Promise.all([
        api.get("/vehicles/stats"),
        api.get("/admin/users/all"),
        api.get("/admin/users/pending"),
        api.get("/admin/users/rejected"),
        api.get("/admin/drivers/pending"),
        api.get("/admin/vehicles/pending"),
        api.get("/admin/logs"),
        api.get("/feedback/all"),
        api.get("/vehicles/master")
      ]);

      // Calculate the Fleet Counts
      const allVehicles = fleetRes.data || [];
      const totalCount = allVehicles.length;
      const activeCount = allVehicles.filter(v => v.status === "IN_USE" || v.status === "BUSY" || v.status === "APPROVED").length;

      const customerAssetsRes = await api.get("/bookings/all").catch(() => ({ data: [] }));
      const pendingCustomerAssets = (customerAssetsRes.data || []).filter(b => b.status === "PENDING");

      setStats(prev => ({
        ...prev,
        fleetTotal: totalCount,
        activeTrips: activeCount,
        systemLoad: statsRes.data.systemLoad || 18,
        iotStatus: statsRes.data.iotStatus || "ONLINE"
      }));

      setUsers(allU.data || []);
      setPendingUsers(pendU.data || []);
      setRejectedUsers(rejU.data || []);
      setPendingDrivers(pendD.data || []);
      setPendingRequests([...(pendV.data || []), ...pendingCustomerAssets]);
      setAuditLogs(logsRes.data || []);

      const validFeedback = (feedRes.data || []).filter(item => item.id);
      if (validFeedback.length > 0) {
        const latest = validFeedback[0];
        if (lastFeedbackIdRef.current !== null && latest.id > lastFeedbackIdRef.current) {
          setNewFeedbackNotify(latest);
          setTimeout(() => setNewFeedbackNotify(null), 5000);
        }
        lastFeedbackIdRef.current = latest.id;
      }
      setGlobalFeedback(validFeedback);

    } catch (err) {
      console.error("Sync Error", err);
      if (err.response?.status === 403) navigate("/login");
    }
  }, [adminToken, navigate]);

  // ACTION HANDLERS
  const handleApproveUser = async (userId) => {
    try {
      const cleanId = userId.toString().split(':')[0];
      await api.put(`/admin/users/approve/${cleanId}`);
      toast.success("OPERATOR_AUTHORIZED");
      fetchEverything();
    } catch (err) { toast.error("APPROVAL_FAILED"); }
  };

  const handleRejectUser = async (userId) => {
    try {
      const cleanId = userId.toString().split(':')[0];
      await api.put(`/admin/users/reject/${cleanId}`);
      toast.error("OPERATOR_REJECTED");
      fetchEverything();
    } catch (err) { toast.error("REJECTION_FAILED"); }
  };

  const handleDriverAuthorize = async (userId) => {
    try {
      const cleanId = userId.toString().split(':')[0];
      await api.put(`/admin/drivers/approve/${cleanId}`);
      toast.success("DRIVER_IDENTITY_VERIFIED");
      fetchEverything();
    } catch (err) { toast.error("DRIVER_SYNC_FAILURE"); }
  };

  // FIXED: handleVehicleAuthorize with correct scoping and ID cleaning
  const handleVehicleAuthorize = async (asset) => {
    let assetId = "Unknown"; // Scope defined outside try block
    try {
      const rawId = asset.bookingId || asset.id || asset._id || asset.vehicleId;
      assetId = String(rawId).split(':')[0]; // Clean the ID

      const isBooking = !!(asset.userId || asset.vehicleModel || asset.bookingId);
      const endpoint = isBooking
        ? `/bookings/approve/${assetId}`
        : `/admin/vehicles/approve/${assetId}`;

      await api.put(endpoint);
      toast.success("SYSTEM_NODE_AUTHORIZED");
      fetchEverything();
    } catch (err) {
      console.error("Auth Error:", err);
      const errorMsg = err.response?.data?.message || `ID ${assetId} not found on server`;
      toast.error(errorMsg);
    }
  };

  const handleVehicleReject = async (asset) => {
    let assetId = "Unknown";
    try {
      const rawId = asset.bookingId || asset.id || asset._id || asset.vehicleId;
      assetId = String(rawId).split(':')[0];

      const isBooking = !!(asset.userId || asset.vehicleModel || asset.bookingId);
      const endpoint = isBooking
        ? `/bookings/reject/${assetId}`
        : `/admin/vehicles/reject/${assetId}`;

      await api.put(endpoint);
      toast.error("NODE_DECOMMISSIONED");
      fetchEverything();
    } catch (err) {
      toast.error(`Error: ID ${assetId} could not be rejected`);
    }
  };

  const handleDeleteFeedback = async (id) => {
    try {
      await api.delete(`/feedback/${id}`);
      toast.success("FEEDBACK_PURGED");
      fetchEverything();
    } catch (err) { toast.error("DELETE_FAILED"); }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("CRITICAL: Permanent removal of operator?")) {
      try {
        await api.delete(`/admin/users/${userId}`);
        toast.warning("UNIT_DECOMMISSIONED");
        fetchEverything();
      } catch (err) { toast.error("TERMINATION_FAILED"); }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put("/profile/update", profile);
      toast.success("PROFILE_SYNC_SUCCESSFUL");
      setIsEditingProfile(false);
      fetchEverything();
    } catch (err) { toast.error("PROFILE_UPDATE_FAILED"); }
  };

  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchEverything();
    toast.info("Updating Data Nodes...");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const filteredUsers = useMemo(() => {
    let baseList = [];
    if (userFilter === 'pending') baseList = pendingUsers;
    else if (userFilter === 'rejected') baseList = rejectedUsers.length > 0 ? rejectedUsers : users.filter(u => u.status?.toLowerCase() === 'rejected');
    else baseList = users;

    return baseList.filter(u =>
      (u.name || u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [userFilter, pendingUsers, rejectedUsers, users, searchQuery]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log =>
      log.actionType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.vehicleModel?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [auditLogs, searchQuery]);

  const AiMapView = ({ data }) => {
    if (!data || data.length === 0) return <AdminHeatMap data={data} />;
    const firstLocation = data[0];
    return (
      <div className="h-full w-full rounded-2xl overflow-hidden">
        <MapContainer
          center={[firstLocation.lat, firstLocation.lng]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {data.map((pos, idx) => (
            <CircleMarker
              key={idx}
              center={[pos.lat, pos.lng]}
              radius={10}
              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: pos.intensity }}
            />
          ))}
        </MapContainer>
      </div>
    );
  };

  useEffect(() => {
    const mockPositions = [
      { lat: 12.9716, lng: 77.5946, intensity: 0.8 },
      { lat: 12.9720, lng: 77.5950, intensity: 0.9 },
      { lat: 12.9352, lng: 77.6245, intensity: 0.6 },
      { lat: 12.9500, lng: 77.6000, intensity: 0.7 },
    ];
    setMobilityData(mockPositions);
  }, []);

  useEffect(() => {
    fetchEverything();
    const statsInterval = setInterval(() => {
      const newLoad = Math.floor(Math.random() * (35 - 15 + 1) + 15);
      setStats(prev => ({ ...prev, systemLoad: newLoad }));
      setGraphData(prev => [...prev.slice(1), {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        load: newLoad
      }]);
    }, 8000);
    const feedbackPoll = setInterval(fetchEverything, 15000);
    return () => { clearInterval(statsInterval); clearInterval(feedbackPoll); };
  }, [fetchEverything]);

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] text-slate-900 font-sans relative overflow-x-hidden">
      <ToastContainer theme="colored" position="bottom-right" />

      <AnimatePresence>
        {newFeedbackNotify && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-24 right-10 z-[100] bg-[#0f172a] text-white p-6 rounded-3xl shadow-2xl border-l-4 border-indigo-500 w-80"
          >
            <div className="flex items-center gap-3 mb-2">
              <NotifyIcon className="text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Incoming_Uplink</span>
            </div>
            <p className="text-xs font-bold">{newFeedbackNotify.operatorName || newFeedbackNotify.name || "User"}</p>
            <p className="text-[11px] text-slate-400 italic">"{newFeedbackNotify.comment || "New status report sent"}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="w-64 bg-[#0f172a] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl">
        <div className="p-8 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg"><LayersIcon /></div>
          <span className="text-xl font-black tracking-tighter italic">NEUROX</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'overview', icon: <DashIcon fontSize="small" />, label: 'Dashboard' },
            { id: 'users', icon: <PeopleIcon fontSize="small" />, label: 'Operators', badge: pendingUsers.length },
            { id: 'drivers', icon: <BadgeIcon fontSize="small" />, label: 'Drivers', badge: pendingDrivers.length },
            { id: 'approvals', icon: <VerifiedIcon fontSize="small" />, label: 'Assets', badge: pendingRequests.length },
            { id: 'feedback', icon: <FeedbackIcon fontSize="small" />, label: 'Feedback', badge: globalFeedback.length },
            { id: 'logs', icon: <LogIcon fontSize="small" />, label: 'Audit' },
            { id: 'profile', icon: <AccountCircleIcon fontSize="small" />, label: 'System Profile' },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-indigo-600 shadow-xl text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}>
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </div>
              {item.badge > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-black">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-6">
          <button onClick={handleLogout} className="w-full py-3 bg-slate-800 hover:bg-rose-600 transition-all rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 tracking-widest italic shadow-lg">
            <LogoutIcon sx={{ fontSize: 14 }} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 relative z-10 min-h-screen">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-3">
             <CircleIcon sx={{ fontSize: 8 }} className="text-emerald-500 animate-pulse" />
             <h1 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] italic">ADMIN / {activeTab}</h1>
          </div>
          <button onClick={handleManualRefresh} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:text-indigo-600 transition-all shadow-sm"><RefreshIcon sx={{ fontSize: 18 }} /></button>
        </header>

        <div className="p-10">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab + refreshKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

              {activeTab === 'overview' && (
                <div className="space-y-10">
                  <div className="bg-[#0f172a] p-8 rounded-[3rem] shadow-2xl border border-slate-800">
                    <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 italic flex items-center gap-2">
                      <NotifyIcon className="text-indigo-400" /> URBAN_MOBILITY_INSIGHTS (HEATMAP)
                    </h2>
                    <div className="h-[400px] w-full bg-[#1a1a1a] rounded-[2rem] overflow-hidden p-4">
                        <AiMapView data={mobilityData} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: "Fleet Total", val: stats.fleetTotal, icon: <DirectionsCarIcon />, border: "border-blue-500", text: "text-blue-600", bg: "bg-blue-50/50" },
                        { label: "Active Trips", val: stats.activeTrips, icon: <AssignmentIcon />, border: "border-indigo-500", text: "text-indigo-600", bg: "bg-indigo-50/50" },
                        { label: "System Load", val: `${stats.systemLoad}%`, icon: <HubIcon />, border: "border-amber-500", text: "text-amber-600", bg: "bg-amber-50/50" },
                        { label: "IoT Status", val: stats.iotStatus, icon: <SensorsIcon />, border: "border-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50/50" }
                    ].map((card, i) => (
                        <div key={i} className={`bg-white p-7 rounded-[2.5rem] border-2 ${card.border} shadow-2xl flex flex-col justify-between h-44 hover:-translate-y-2 transition-all`}>
                            <div className={`${card.bg} ${card.text} w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm`}>{card.icon}</div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">{card.label}</p>
                                <p className="text-4xl font-[900] text-slate-900 tracking-tighter italic">{card.val}</p>
                            </div>
                        </div>
                    ))}
                  </div>

                  <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-2xl">
                    <h3 className="text-xs font-[900] uppercase mb-8 flex items-center gap-3 text-slate-900 tracking-[0.3em] italic">
                        <TimelineIcon className="text-indigo-500" /> System_Performance_Matrix
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={graphData}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" hide />
                                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="load" stroke="#6366f1" fillOpacity={1} fill="url(#colorLoad)" strokeWidth={4} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8 space-y-8">
                        <div className="bg-[#0f172a] p-8 rounded-[3rem] shadow-2xl flex justify-between items-center gap-6 border border-slate-800">
                          <div className="flex items-center gap-5">
                              <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl">
                                  <StorageIcon fontSize="large" />
                              </div>
                              <div className="text-left">
                                  <h3 className="text-3xl font-[900] text-white tracking-tighter uppercase italic leading-none">Fleet_Inventory</h3>
                                  <p className="text-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase mt-2">System_Status: Operational</p>
                              </div>
                          </div>
                          <div className="relative w-[350px]">
                              <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input type="text" placeholder="SEARCH NODES..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full bg-slate-800/50 border-2 border-slate-700 text-white rounded-[1.5rem] py-4 pl-16 pr-8 text-xs font-black outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 uppercase" />
                          </div>
                        </div>
                        <VehicleGrid key={refreshKey} onRefreshStats={fetchEverything} />
                    </div>
                    <div className="col-span-4 space-y-8">
                      <div className="bg-white rounded-[2.5rem] border-2 border-slate-900 shadow-2xl overflow-hidden">
                        <AddVehicle onAddSuccess={fetchEverything} />
                      </div>
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl min-h-[300px]">
                        <h4 className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase italic flex items-center gap-2 mb-8">
                          <FeedIcon sx={{fontSize: 14}} /> LIVE_SYSTEM_UPLINK
                        </h4>
                        <div className="space-y-6">
                            {filteredLogs.slice(0, 5).map((log, i) => (
                              <div key={i} className="flex gap-4 border-l-2 border-slate-800 pl-4 py-1 hover:border-indigo-500 transition-colors group cursor-default">
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                  <p className="text-[11px] font-black text-slate-300 group-hover:text-white transition-colors uppercase">
                                    {log.actionType} | {log.vehicleModel || "SYSTEM"}
                                  </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white rounded-[3rem] shadow-2xl p-12 min-h-[600px] border border-slate-200">
                  <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><PeopleIcon /></div>
                      <h3 className="font-black text-xl uppercase tracking-widest italic">Operator_Terminal</h3>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                      {['all', 'pending', 'rejected'].map(t => (
                        <button key={t} onClick={() => setUserFilter(t)} className={`px-8 py-2.5 text-[10px] font-black rounded-xl uppercase transition-all ${userFilter === t ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    {filteredUsers.map(u => (
                      <div key={u.id} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all flex justify-between items-center group">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                            { (u.name || u.username || "?")[0].toUpperCase() }
                          </div>
                          <div>
                            <p className="font-black text-2xl text-slate-900 uppercase italic tracking-tighter">{u.name || u.username}</p>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{u.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                            u.status?.toLowerCase() === 'approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                            u.status?.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-amber-50 text-amber-500 border-amber-100'
                          }`}>
                            {u.status?.toLowerCase() === 'rejected' && <BlockIcon sx={{fontSize: 12}} />}
                            {u.status || 'PENDING'}
                          </span>

                          {u.status?.toLowerCase() === 'pending' && (
                            <div className="flex gap-3">
                              <button onClick={() => handleApproveUser(u.id)} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">Authorize <AuthorizeIcon sx={{fontSize: 14}}/></button>
                              <button onClick={() => handleRejectUser(u.id)} className="bg-slate-100 text-slate-500 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Reject</button>
                            </div>
                          )}

                          {u.status?.toLowerCase() === 'rejected' && (
                            <button onClick={() => handleApproveUser(u.id)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                              <UndoIcon sx={{fontSize: 20}} />
                            </button>
                          )}

                          <button onClick={() => handleDeleteUser(u.id)} className="p-3 text-rose-300 hover:text-rose-500 transition-colors">
                            <DeleteIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'drivers' && (
                <div className="bg-white rounded-[3rem] shadow-2xl p-12 min-h-[600px] border border-slate-200">
                  <div className="flex items-center gap-4 mb-12">
                      <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><BadgeIcon /></div>
                      <h3 className="font-black text-xl uppercase tracking-widest italic">Pending_Driver_Verification</h3>
                  </div>
                  <div className="space-y-6">
                    {pendingDrivers.map(d => (
                      <div key={d.id} className="p-10 bg-slate-50/50 border border-slate-100 rounded-[3rem] flex justify-between items-center group hover:bg-white hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center text-slate-400 font-black text-3xl italic">V</div>
                            <div>
                             <p className="font-black text-3xl text-slate-900 uppercase italic tracking-tighter">{d.username || d.name}</p>
                             <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mt-2">LICENSE: {d.licenseNumber || "ID_REDACTED"}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => handleDriverAuthorize(d.id)} className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100">Approve</button>
                          <button onClick={() => handleRejectUser(d.id)} className="bg-rose-50 text-rose-500 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {activeTab === 'approvals' && (
              <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl p-10">
                <h3 className="font-[900] text-sm uppercase tracking-[0.3em] italic mb-10 flex items-center gap-2">
                  <VerifiedIcon /> Neural_Asset_Authorizations (Drivers & Customers)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {pendingRequests.length > 0 ? (
                    pendingRequests.map((req) => (
                      <VehicleCard
                        key={req.id || req._id}
                        vehicle={{
                          ...req,
                          model: req.vehicleModel || req.model || req.userName || "Asset Node",
                          status: "PENDING"
                        }}
                        onEdit={() => handleVehicleAuthorize(req)}
                        onReject={() => handleVehicleReject(req)}
                        onDelete={() => handleVehicleReject(req)}
                      />
                    ))
                  ) : (
                    <div className="col-span-2 py-20 text-center">
                      <p className="text-slate-300 font-black uppercase italic tracking-widest">
                        No Pending Assets Found in Registry
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

              {activeTab === 'feedback' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {globalFeedback.map(f => (
                    <div key={f.id} className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-2xl relative group">
                      <button onClick={() => handleDeleteFeedback(f.id)} className="absolute top-6 right-6 p-2 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:text-white">
                        <DeleteIcon />
                      </button>
                      <div className="flex gap-1 mb-6 text-amber-500">
                        {[...Array(5)].map((_, i) => <StarIcon key={i} sx={{ fontSize: 20, opacity: i < (f.rating || 5) ? 1 : 0.2 }} />)}
                      </div>
                      <p className="text-xl font-black text-slate-800 italic">"{f.comment || f.message}"</p>
                      <div className="mt-8 pt-8 border-t flex justify-between items-center">
                        <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">— {f.name || f.operatorName || "Anonymous"}</p>
                        <span className="text-[10px] text-slate-400 font-mono italic">{f.timestamp ? new Date(f.timestamp).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="bg-[#0f172a] rounded-[3rem] p-10 shadow-2xl text-white">
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-10">Audit_Control_Logs</h3>
                   <div className="space-y-4 h-[500px] overflow-y-auto pr-4">
                      {filteredLogs.map((log, i) => (
                        <div key={i} className="p-6 bg-slate-800/50 rounded-2xl flex justify-between items-center border border-slate-700">
                            <span className="text-indigo-400 font-mono text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-lg ${log.actionType?.includes('APPROVED') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{log.actionType}</span>
                            <span className="font-bold italic uppercase tracking-tighter">{log.vehicleModel || "SYSTEM"}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="max-w-3xl mx-auto bg-white rounded-[3rem] p-12 border-2 border-slate-100 shadow-2xl">
                  <div className="flex items-center gap-8 mb-12">
                    <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black uppercase">{(profile.name || "A").charAt(0)}</div>
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter uppercase italic">{profile.name}</h2>
                      <p className="text-indigo-600 font-black tracking-[0.3em] text-[10px] uppercase mt-2">Core_Admin_Access</p>
                    </div>
                  </div>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator_Name</label>
                          <input disabled={!isEditingProfile} value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-indigo-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comm_Link</label>
                          <input disabled={!isEditingProfile} value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-indigo-500" />
                        </div>
                     </div>
                     <button type="button" onClick={() => setIsEditingProfile(!isEditingProfile)} className="w-full py-5 border-2 border-slate-900 rounded-2xl font-black uppercase text-xs italic hover:bg-slate-900 hover:text-white transition-all">{isEditingProfile ? "Cancel" : "Reconfigure_Identity"}</button>
                     {isEditingProfile && <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs italic shadow-xl">Commit_Changes</button>}
                  </form>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;