import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axios from 'axios';
import { MapContainer, TileLayer, useMap, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import "react-toastify/dist/ReactToastify.css";

// --- API and Components ---
import api, { getProfile, updateProfile } from "../api";
import Navbar from "../components/Navbar";
import CustomerVehicleBrowser from "../components/CustomerVehicleBrowser";

// --- Icons ---
import {
    Hourglass, Star, Bell,
    User, Zap, LogOut, X, Navigation,
    LayoutDashboard, ShieldAlert, Loader2,
    Battery, Gauge, Cpu, History, Save, Send, DollarSign, ChevronRight, MessageSquare, Radio
} from "lucide-react";

// --- GLOBAL LEAFLET FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const srcIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const destIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

// --- SEARCH COMPONENT ---
const SearchField = ({ setPos, setName, placeholder, uniqueId }) => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const provider = new OpenStreetMapProvider();
        const searchControl = new GeoSearchControl({
            provider, style: 'bar', showMarker: false, autoClose: true,
            placeholder, keepResult: true, classNames: { container: `leaflet-geosearch-button-${uniqueId}` }
        });
        map.addControl(searchControl);
        const handleShow = (result) => {
            if (map._activeSearchId === uniqueId && result?.location) {
                setPos([result.location.y, result.location.x]);
                setName(result.location.label.split(',')[0]);
            }
        };
        map.on('geosearch/showlocation', handleShow);
        const timer = setTimeout(() => {
            const input = searchControl.getContainer()?.querySelector('input');
            if (input) input.addEventListener('focus', () => { map._activeSearchId = uniqueId; });
        }, 300);
        return () => {
            map.off('geosearch/showlocation', handleShow);
            try { map.removeControl(searchControl); } catch (e) {}
            clearTimeout(timer);
        };
    }, [map, setPos, setName, placeholder, uniqueId]);
    return null;
};

// --- STABLE ROUTING ENGINE ---
const RoutingEngine = ({ start, end, setRouteData }) => {
    useEffect(() => {
        if (!start || !end) return;
        let isSubscribed = true;

        const fetchPath = async () => {
            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
                );
                const data = await response.json();

                if (isSubscribed && data.routes && data.routes[0]) {
                    const r = data.routes[0];
                    setRouteData({
                        polyline: r.geometry.coordinates.map(c => [c[1], c[0]]),
                        distance: (r.distance / 1000).toFixed(1),
                        time: (r.duration / 3600).toFixed(1)
                    });
                }
            } catch (err) {
                console.error("OSRM Failure:", err);
            }
        };

        fetchPath();
        return () => { isSubscribed = false; };
    }, [start, end, setRouteData]);

    return null;
};

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [linkedVehicles, setLinkedVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarTab, setSidebarTab] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
    const [rating, setRating] = useState(0);
    const [feedbackMsg, setFeedbackMsg] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [pickupTime, setPickupTime] = useState(new Date().toISOString().slice(0, 16));

    const [manualMsg, setManualMsg] = useState({ pickup: "", drop: "" });
    const [incomingDriverMsg, setIncomingDriverMsg] = useState(null);

    const [start, setStart] = useState([13.0827, 80.2707]);
    const [end, setEnd] = useState([12.9716, 77.5946]);
    const [startName, setStartName] = useState("Origin Node");
    const [endName, setEndName] = useState("Destination Node");
    const [routeData, setRouteData] = useState({ polyline: [], distance: 0, time: 0 });

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const estimatedFare = useMemo(() => (routeData.distance * 15.0).toFixed(2), [routeData.distance]);

    useEffect(() => {
        const handleIncomingSignal = (e) => {
            if (e.key === 'driverResponse' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    setIncomingDriverMsg(data);
                    toast.info(`New Signal: ${data.text}`, { icon: <Radio className="text-indigo-400" /> });
                    setTimeout(() => setIncomingDriverMsg(null), 10000);
                } catch (err) { console.error(err); }
            }
        };
        window.addEventListener('storage', handleIncomingSignal);
        return () => window.removeEventListener('storage', handleIncomingSignal);
    }, []);

    const fetchData = useCallback(async () => {
        if (!userId) return;
        try {
            const [p, b, v] = await Promise.all([
                getProfile(),
                api.get(`/bookings/user/${userId}`),
                api.get('/vehicles')
            ]);
            if (p.data) setProfile(p.data);
            setLinkedVehicles(b.data || []);
            setVehicles(v.data || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleProfileUpdate = async () => {
        setIsSaving(true);
        try {
            await updateProfile(profile);
            toast.success("Profile Updated");
            setIsEditing(false);
        } catch (e) { toast.error("Update Failed"); }
        finally { setIsSaving(false); }
    };

    const handleFeedbackSubmit = async () => {
        try {
            await axios.post("http://localhost:8080/api/feedback/submit",
                { operatorName: profile.name, rating, message: feedbackMsg },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success("Broadcast Transmitted");
            setSidebarTab(null);
        } catch (e) { toast.error("Transmission Failed"); }
    };

    const sendManualMission = () => {
        if (!manualMsg.pickup || !manualMsg.drop) {
            toast.warning("Incomplete Coordinates");
            return;
        }
        const missionData = {
            id: "MSG-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
            userName: profile.name,
            vehicleModel: "MANUAL_LINK",
            pickupLocation: manualMsg.pickup,
            dropLocation: manualMsg.drop,
            departureTime: new Date().toLocaleTimeString(),
            status: "PENDING",
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('activeMission', JSON.stringify(missionData));
        window.dispatchEvent(new Event("storage"));
        toast.success("Manual Mission Dispatched!");
        setManualMsg({ pickup: "", drop: "" });
    };

    const handleConfirmBooking = async () => {
        try {
            const missionData = {
                id: "TRIP-" + Math.random().toString(36).substr(2, 9),
                userName: profile.name,
                vehicleModel: selectedVehicle?.model || "NEUROX_UNIT",
                pickupLocation: startName,
                dropLocation: endName,
                departureTime: pickupTime,
                distance: routeData.distance,
                duration: routeData.time,
                status: "PENDING",
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('activeMission', JSON.stringify(missionData));
            window.dispatchEvent(new Event("storage"));
            await api.post("/bookings/create", {
                vehicleModel: missionData.vehicleModel,
                vehicleId: selectedVehicle?.id,
                userId: userId,
                pickupLocation: missionData.pickupLocation,
                dropLocation: missionData.dropLocation,
                status: "PENDING"
            });
            toast.success("Mission Authorized!");
            setShowConfirmModal(false);
            fetchData();
        } catch (e) { toast.error("Transmission Failed."); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#F0F2F5] text-indigo-600"><Loader2 className="animate-spin" size={50} /></div>;

    return (
        <div className="flex h-screen bg-[#F0F2F5] overflow-hidden text-slate-800">
            <ToastContainer theme="dark" position="bottom-right" />

            {/* DRIVER RESPONSE UI */}
            <AnimatePresence>
                {incomingDriverMsg && (
                    <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
                        className="fixed top-24 right-8 z-[1000] bg-[#0B0E14] border-l-4 border-indigo-500 p-6 rounded-2xl shadow-2xl text-white w-80">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Radio className="text-indigo-500 animate-pulse" size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Incoming Signal</span>
                            </div>
                            <button onClick={() => setIncomingDriverMsg(null)}><X size={14} className="text-slate-500 hover:text-white"/></button>
                        </div>
                        <p className="text-sm font-bold italic text-slate-200">"{incomingDriverMsg.text}"</p>
                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase">
                            <span className="text-indigo-400">Operator: {incomingDriverMsg.sender || "Driver"}</span>
                            <span className="text-slate-600">{new Date(incomingDriverMsg.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <aside className="w-20 lg:w-72 bg-[#0B0E14] text-slate-400 flex flex-col p-6 z-50">
                <div className="flex items-center gap-4 mb-12 py-2 cursor-pointer" onClick={() => setSidebarTab(null)}>
                    <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg"><Zap size={22} fill="white" /></div>
                    <span className="font-black text-2xl text-white hidden lg:block tracking-tighter uppercase">Neurox</span>
                </div>
                <nav className="flex-1 space-y-2">
                    <button onClick={() => setSidebarTab(null)} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold transition-all ${!sidebarTab ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-white/5'}`}><LayoutDashboard size={20} /> <span className="hidden lg:block">Dashboard</span></button>
                    <button onClick={() => setSidebarTab('profile')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${sidebarTab === 'profile' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'}`}><User size={20} /> <span className="hidden lg:block">Profile</span></button>
                    <button onClick={() => setSidebarTab('feedback')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${sidebarTab === 'feedback' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'}`}><Star size={20} /> <span className="hidden lg:block">Feedback</span></button>
                    <button onClick={() => setSidebarTab('alerts')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${sidebarTab === 'alerts' ? 'bg-rose-600 text-white' : 'hover:bg-white/5'}`}><Bell size={20} /> <span className="hidden lg:block">Alerts</span></button>
                </nav>
                <button onClick={() => { localStorage.clear(); navigate("/login"); }} className="flex items-center gap-4 w-full p-4 text-slate-500 hover:text-rose-500 transition-all mt-auto border-t border-white/5 pt-8">
                    <LogOut size={20} /> <span className="hidden lg:block text-sm font-bold uppercase tracking-widest">Sign Out</span>
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar title="CUSTOMER COMMAND" />
                <main className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="bg-[#0B0E14] rounded-[2.5rem] p-10 text-white flex justify-between items-center shadow-2xl">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">System Ready, {profile.name}</h1>
                            <p className="text-slate-400 mt-2 flex items-center gap-2 font-medium"><Cpu size={18} className="text-indigo-500" /> Neural Link Established</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-4 space-y-8">
                            <div className="bg-[#1e2330] p-8 rounded-[2.5rem] text-white flex flex-col shadow-xl">
                                <h2 className="text-2xl font-black flex items-center gap-3 mb-8"><Navigation size={22} className="text-indigo-500" /> Mission Plan</h2>
                                <div className="space-y-4 flex-1 font-bold text-sm">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest ml-2">Origin Node</p>
                                        <input value={startName} readOnly className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-slate-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest ml-2">Destination Node</p>
                                        <input value={endName} readOnly className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-slate-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest ml-2">Departure Window</p>
                                        <input type="datetime-local" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-white" />
                                    </div>
                                </div>
                                <div className="pt-8 border-t border-white/5 mt-8 flex justify-between items-end">
                                    <div><p className="text-4xl font-black">{routeData.time}h</p><p className="text-[10px] text-slate-400 uppercase font-black">{routeData.distance} KM</p></div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-emerald-400 flex items-center justify-end"><DollarSign size={20}/>{estimatedFare}</p>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Est. Credits</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border p-8 rounded-[2.5rem] shadow-xl">
                                <h3 className="text-slate-900 font-black uppercase text-xs flex items-center gap-3 mb-6 tracking-widest text-indigo-600"><MessageSquare size={18} /> Signal Uplink</h3>
                                <div className="space-y-4">
                                    <input placeholder="ENTER PICKUP..." className="w-full bg-slate-100 p-4 rounded-2xl text-xs font-black uppercase outline-none" value={manualMsg.pickup} onChange={(e) => setManualMsg({...manualMsg, pickup: e.target.value})} />
                                    <input placeholder="ENTER DROP..." className="w-full bg-slate-100 p-4 rounded-2xl text-xs font-black uppercase outline-none" value={manualMsg.drop} onChange={(e) => setManualMsg({...manualMsg, drop: e.target.value})} />
                                    <button onClick={sendManualMission} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><Send size={14} /> Send Signal</button>
                                </div>
                            </div>
                        </div>

                        {/* STABILIZED MAP */}
                        <div className="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] p-4 border shadow-sm h-[500px]">
                            <MapContainer center={start} zoom={7} style={{ height: '100%', width: '100%', borderRadius: '2rem' }}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                <SearchField setPos={setStart} setName={setStartName} placeholder="Search Origin" uniqueId="origin" />
                                <SearchField setPos={setEnd} setName={setEndName} placeholder="Search Destination" uniqueId="destination" />
                                <RoutingEngine start={start} end={end} setRouteData={setRouteData} />
                                <Marker position={start} icon={srcIcon} />
                                <Marker position={end} icon={destIcon} />
                                {routeData.polyline.length > 0 && <Polyline positions={routeData.polyline} color="#6366f1" weight={6} opacity={0.6} />}
                            </MapContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-[#1e2330] rounded-[2.5rem] p-8 text-white shadow-xl">
                            <h3 className="text-indigo-400 font-black uppercase text-xs flex items-center gap-3 mb-8 tracking-widest"><Gauge size={18} /> Asset Telemetry</h3>
                            <div className="space-y-4">
                                {linkedVehicles.length > 0 ? linkedVehicles.slice(0, 2).map(v => (
                                    <div key={v.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                        <div className="flex justify-between items-center mb-4"><span className="font-black text-sm uppercase tracking-wider">{v.vehicleModel}</span><span className="text-emerald-400 text-xs font-bold uppercase">Online</span></div>
                                        <div className="flex justify-between text-[10px] font-black uppercase mb-1"><span><Battery size={12} className="inline mr-1 text-indigo-400"/> Power</span><span>88%</span></div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[88%]" /></div>
                                    </div>
                                )) : <div className="p-8 text-center text-slate-500 font-bold uppercase text-xs border border-dashed border-white/10 rounded-3xl">No Active Assets</div>}
                            </div>
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-8 border shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="bg-amber-50 p-6 rounded-full mb-4 text-amber-500"><Hourglass size={32} className="animate-pulse" /></div>
                            <p className="font-black uppercase text-xs text-slate-500 tracking-tighter">Awaiting Signal Approval</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {vehicles.map(v => (
                            <div key={v.id} className="bg-white border rounded-[2.5rem] p-8 shadow-sm hover:border-indigo-500 transition-all flex flex-col justify-between">
                                <h4 className="font-black text-2xl uppercase mb-6 text-slate-800 tracking-tight">{v.model}</h4>
                                <button onClick={() => {setSelectedVehicle(v); setShowConfirmModal(true);}} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">Authorize <ChevronRight size={14}/></button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-[3rem] p-10 border shadow-sm">
                        <div className="flex items-center gap-4 mb-10 pb-8 border-b"><div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg"><History size={26} /></div><h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Mission Registry</h2></div>
                        <CustomerVehicleBrowser userId={userId} onRefresh={fetchData} role="customer" />
                    </div>
                </main>
            </div>

            {/* MODALS */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-[#1e2330] w-full max-w-md rounded-[3.5rem] p-10 border border-white/10 shadow-2xl text-white text-center">
                            <h3 className="text-2xl font-black uppercase mb-8 tracking-wider">Confirm Mission</h3>
                            <div className="space-y-4 mb-10 text-left bg-white/5 p-6 rounded-3xl font-bold text-[10px] uppercase text-slate-400">
                                <p>Unit: <span className="text-white ml-2">{selectedVehicle?.model}</span></p>
                                <p>Origin: <span className="text-emerald-400 ml-2">{startName}</span></p>
                                <p>Dest: <span className="text-rose-400 ml-2">{endName}</span></p>
                                <p>Estimate: <span className="text-indigo-400 ml-2">{estimatedFare} Credits</span></p>
                            </div>
                            <div className="flex gap-4 font-black">
                                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-white/5 rounded-2xl uppercase text-[10px] transition-all">Abort</button>
                                <button onClick={handleConfirmBooking} className="flex-1 py-4 bg-indigo-600 rounded-2xl uppercase text-[10px] shadow-lg shadow-indigo-600/20 transition-all">Execute</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {sidebarTab && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarTab(null)} className="fixed inset-0 bg-slate-900/60 z-[100]" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-[101] flex flex-col rounded-l-[3.5rem] p-12 overflow-y-auto">
                            <div className="flex justify-between items-center mb-12"><h2 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">{sidebarTab}</h2><button onClick={() => setSidebarTab(null)}><X size={30}/></button></div>
                            {sidebarTab === 'profile' && (
                                <div className="space-y-6">
                                    <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} disabled={!isEditing} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" />
                                    <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" />
                                    {isEditing ? <button onClick={handleProfileUpdate} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2"><Save size={18}/> {isSaving ? "Syncing..." : "Sync Records"}</button> : <button onClick={() => setIsEditing(true)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">Edit Records</button>}
                                </div>
                            )}
                            {sidebarTab === 'feedback' && (
                                <div className="space-y-8">
                                    <div className="flex gap-2 justify-center">{[1,2,3,4,5].map(n => <button key={n} onClick={() => setRating(n)} className={`p-4 rounded-xl transition-all ${rating >= n ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50'}`}><Star size={20} fill={rating >= n ? "white" : "none"}/></button>)}</div>
                                    <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} className="w-full h-48 bg-slate-50 p-6 rounded-3xl font-bold outline-none border-none" placeholder="Enter transmission..." />
                                    <button onClick={handleFeedbackSubmit} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 tracking-widest transition-all"><Send size={18}/> Transmit</button>
                                </div>
                            )}
                            {sidebarTab === 'alerts' && (
                                <div className="space-y-4">
                                    <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center gap-6"><ShieldAlert className="text-rose-500" size={30}/><p className="font-bold text-rose-800 uppercase text-xs">Security Status: Optimal</p></div>
                                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex items-center gap-6"><Bell className="text-indigo-500" size={30}/><p className="font-bold text-indigo-800 uppercase text-xs">Neural Link Status: Secure</p></div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomerDashboard;