import React, { useState, useEffect, useCallback } from "react";
import { getProfile, updateProfile } from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import PhonelinkRingIcon from '@mui/icons-material/PhonelinkRing';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';

const Profile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState({ name: "", email: "", role: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await getProfile();
      setProfile(response.data);
    } catch (err) {
      toast.error("Session Link Severed. Relogin.");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!token) navigate("/login");
    else fetchProfile();
  }, [token, fetchProfile, navigate]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await updateProfile(profile);
      if (response.data.status === "success") {
        toast.success("Profile Persistence Confirmed");
        setIsEditing(false);
      }
    } catch (err) {
      toast.error("Database Link Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
        <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500 blur-xl opacity-20 animate-pulse" />
            <p className="text-indigo-400 font-black font-mono animate-pulse uppercase tracking-[0.5em] relative">
                SYNCHRONIZING_IDENTITY...
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-200 p-6 font-sans relative overflow-hidden flex items-center justify-center selection:bg-indigo-500/30">

      {/* NEON AMBIENCE - GLOW EFFECTS */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* CYBER GRID BACKGROUND */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full bg-[#0d1117]/80 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-8 lg:p-14 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden group hover:border-indigo-500/20 transition-all duration-700"
      >
        {/* TOP NEON LINE ACCENT */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 shadow-[0_0_15px_#6366f1]" />

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-white/5 pb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <SecurityIcon className="text-indigo-500" sx={{ fontSize: 18 }} />
                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] italic opacity-80">Encryption_Level: AES-256</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white leading-none">
              OPERATOR<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">_IDENTITY</span>
            </h1>
          </div>

          <motion.button
            whileHover={{ x: -5, boxShadow: "0 0 20px rgba(99,102,241,0.2)" }}
            onClick={() => navigate(-1)}
            className="px-8 py-3 border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all flex items-center gap-3 backdrop-blur-md"
          >
            <ArrowBackIcon sx={{ fontSize: 14 }} /> Back_To_Grid
          </motion.button>
        </div>

        <div className="flex flex-col md:flex-row gap-14">
          {/* AVATAR AND CONTROLS */}
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              {/* Spinning Glow Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 border-2 border-dashed border-indigo-500/20 rounded-full"
              />

              <div className="relative w-40 h-40 rounded-full bg-[#05070a] border-2 border-white/10 flex items-center justify-center text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-white to-blue-400 shadow-[0_0_40px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_60px_rgba(99,102,241,0.25)] transition-all duration-500">
                {profile.name?.charAt(0) || "U"}
              </div>

              <div className="absolute bottom-2 right-2 bg-emerald-500 w-5 h-5 rounded-full border-4 border-[#0d1117] shadow-[0_0_15px_#10b981]" />
            </div>

            <div className="w-full space-y-3">
                <button
                onClick={() => setIsEditing(!isEditing)}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl ${
                    isEditing
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
                }`}
                >
                {isEditing ? "Cancel_Update" : "Modify_Parameters"}
                </button>
            </div>
          </div>

          {/* FIELDS GRID */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
            <IdentityField
              label="Legal_Alias"
              value={profile.name}
              icon={<BadgeIcon />}
              isEditing={isEditing}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
            />
            <IdentityField
              label="Secure_Mail"
              value={profile.email}
              icon={<EmailIcon />}
              readOnly
            />
            <IdentityField
              label="Node_Privilege"
              value={profile.role}
              icon={<FingerprintIcon />}
              readOnly
            />
            <IdentityField
              label="Comm_Channel"
              value={profile.phone}
              icon={<PhonelinkRingIcon />}
              isEditing={isEditing}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
            />
            <div className="md:col-span-2">
              <IdentityField
                label="Sector_Address"
                value={profile.address}
                icon={<LocationOnIcon />}
                isEditing={isEditing}
                isTextArea
                onChange={(e) => setProfile({...profile, address: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <AnimatePresence>
            {isEditing && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <motion.button
                    whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(16,185,129,0.3)" }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full mt-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-[0_0_25px_rgba(16,185,129,0.2)] disabled:opacity-50 transition-all italic"
                >
                    {saving ? "ENCRYPTING_DATA..." : "COMMIT_IDENTITY_SYNC"}
                </motion.button>
            </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// GLOWING FIELD COMPONENT
const IdentityField = ({ label, value, icon, isEditing, readOnly, isTextArea, onChange }) => {
  return (
    <div className="group/field relative">
      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3 group-hover/field:text-indigo-400 transition-colors italic">
        <span className="opacity-70 group-hover/field:scale-110 transition-transform">{icon}</span> {label}
      </label>

      <div className="relative">
          {isTextArea ? (
            <textarea
              value={value}
              onChange={onChange}
              readOnly={!isEditing || readOnly}
              className={`w-full p-5 rounded-[1.5rem] bg-black/40 border transition-all duration-500 outline-none h-28 resize-none font-bold
                ${isEditing && !readOnly
                  ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-white"
                  : "border-white/5 text-slate-400 group-hover/field:border-white/20"}
              `}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={onChange}
              readOnly={!isEditing || readOnly}
              className={`w-full p-5 rounded-[1.5rem] bg-black/40 border transition-all duration-500 outline-none font-bold
                ${isEditing && !readOnly
                  ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-white"
                  : "border-white/5 text-slate-400 group-hover/field:border-white/20"}
              `}
            />
          )}

          {/* Subtle Focus Underline */}
          <div className={`absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-opacity duration-500 ${isEditing ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </div>
  );
};

export default Profile;

