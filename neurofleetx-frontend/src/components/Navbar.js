import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const Navbar = ({ title, onProfileClick }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const email = localStorage.getItem("email") || "Admin_User";
  const initial = email.charAt(0).toUpperCase();

  const handleLogout = (e) => {
    e.stopPropagation();
    localStorage.removeItem("token");
    localStorage.removeItem("roleId");
    toast.success("System Session Terminated");
    navigate("/login");
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (onProfileClick) {
      onProfileClick(); // Triggers the Drawer in AdminDashboard
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brandContainer}>
        <div style={styles.brandPulse}></div>
        <h2 style={styles.brand}>{title}</h2>
      </div>

      <div
        style={styles.profileArea}
        onMouseEnter={() => setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
      >
        <div style={styles.avatar}>{initial}</div>
        <span style={styles.userName}>Console_Admin</span>
        <KeyboardArrowDownIcon style={{fontSize: '18px', opacity: 0.5}} />

        {showDropdown && (
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              <div style={styles.statusDot}></div>
              {email}
            </div>

            <button style={styles.dropItem} onClick={handleProfileClick}>
              <AccountCircleIcon style={styles.icon} />
              Open_Profile
            </button>

            <div style={styles.divider}></div>

            <button style={{...styles.dropItem, color: "#ff4d4d"}} onClick={handleLogout}>
              <LogoutIcon style={styles.icon} />
              Terminate_Session
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

// ... keep styles same as previous Navbar version ...
const styles = {
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 40px", height: "80px", background: "rgba(10, 12, 16, 0.8)",
    backdropFilter: "blur(20px)", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.05)",
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
  },
  brandContainer: { display: "flex", alignItems: "center", gap: "15px" },
  brandPulse: { width: "8px", height: "8px", background: "#6366f1", borderRadius: "50%", boxShadow: "0 0 15px #6366f1" },
  brand: { fontSize: "20px", margin: 0, fontWeight: "900", letterSpacing: "-0.05em", textTransform: "uppercase", fontStyle: "italic" },
  profileArea: { display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", position: "relative", padding: "10px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", transition: "all 0.3s", border: "1px solid rgba(255,255,255,0.05)" },
  avatar: { width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(45deg, #6366f1, #a855f7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "14px" },
  userName: { fontWeight: "700", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" },
  dropdown: { position: "absolute", right: 0, top: "100%", marginTop: "10px", background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", width: "220px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", overflow: "hidden", padding: "8px" },
  dropdownHeader: { padding: "15px", fontSize: "10px", color: "#6366f1", fontWeight: "900", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" },
  statusDot: { width: "6px", height: "6px", background: "#10b981", borderRadius: "50%" },
  divider: { height: "1px", background: "rgba(255,255,255,0.05)", margin: "8px 0" },
  dropItem: { width: "100%", padding: "12px 15px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "10px", borderRadius: "12px", transition: "background 0.2s" },
  icon: { fontSize: "18px" }
};

export default Navbar;