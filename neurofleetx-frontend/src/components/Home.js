import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.glassBox}>
        <h1 style={styles.title}>
          SMART FLEET <span style={styles.accent}>MANAGEMENT</span>
        </h1>

        <p style={styles.subtitle}>
          A centralized platform to manage fleet inventory, monitor real-time vehicle telemetry,
          track GPS location, battery, fuel, and vehicle operational status through
          an intelligent dashboard.
        </p>

        <p style={styles.accessText}>Access the system as:</p>

        <div style={styles.buttonGroup}>
          <button
            style={styles.loginBtn}
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            style={styles.registerBtn}
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>

        <p style={styles.footer}>
          Vehicle Telemetry • GPS Tracking • Fleet Inventory
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70')", // keep your car background
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Segoe UI, sans-serif",
  },

  glassBox: {
    width: "65%",
    maxWidth: "750px",
    padding: "50px 40px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, rgba(20,20,20,0.9), rgba(35,35,35,0.8))",
    border: "1px solid rgba(0, 255, 255, 0.2)",
    boxShadow: "0 0 40px rgba(0, 255, 255, 0.3)",
    backdropFilter: "blur(15px)",
    WebkitBackdropFilter: "blur(15px)",
    textAlign: "center",
    color: "#ffffff",
    transition: "all 0.3s ease",
  },

  title: {
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "18px",
    letterSpacing: "1px",
  },

  accent: {
    color: "#00e5ff",
  },

  subtitle: {
    fontSize: "16px",
    lineHeight: "1.8",
    color: "#e0e0e0",
    marginBottom: "25px",
  },

  accessText: {
    fontSize: "15px",
    marginBottom: "12px",
    color: "#cfd8dc",
    fontWeight: "500",
  },

  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "18px",
    marginBottom: "30px",
  },

  loginBtn: {
    padding: "12px 40px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "30px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    color: "#fff",
    boxShadow: "0 4px 15px rgba(0, 198, 255, 0.5)",
    transition: "all 0.3s ease",
  },

  registerBtn: {
    padding: "12px 40px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "30px",
    cursor: "pointer",
    background: "transparent",
    border: "2px solid #00e5ff",
    color: "#00e5ff",
    boxShadow: "0 4px 15px rgba(0, 229, 255, 0.3)",
    transition: "all 0.3s ease",
  },

  footer: {
    fontSize: "13px",
    color: "#cfd8dc",
    marginTop: "10px",
  },
};

export default Home;




