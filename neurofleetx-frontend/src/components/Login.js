import React, { useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(null);
  const [responseMessage, setResponseMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const redirectByRoleId = (roleId) => {
    switch (roleId) {
      case 1: window.location.href = "/admin/dashboard"; break;
      case 2: window.location.href = "/manager/dashboard"; break;
      case 3: window.location.href = "/driver/dashboard"; break;
      case 4: window.location.href = "/customer/dashboard"; break;
      default: window.location.href = "/login";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setResponseMessage(null);
    setFieldErrors({});
    const errors = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) errors.email = "Email Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errors.email = "Invalid Email";

    if (!trimmedPassword) errors.password = "Password Required";
    else if (trimmedPassword.length < 8) errors.password = "Min 8 Characters";

    if (!roleId) errors.role = "Role Required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setResponseMessage({ text: "Missing Parameters", status: "error" });
      return;
    }

    try {
          const res = await api.post("/login", { email: trimmedEmail, password: trimmedPassword, roleId });

          // Save all necessary identifiers
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("roleId", String(res.data.roleId));

          // CRITICAL FIX: Match the Backend key 'userId'
          localStorage.setItem("userId", String(res.data.userId));

          localStorage.setItem("email", trimmedEmail);
          localStorage.setItem("userName", res.data.name || "User");

          setResponseMessage({ text: "Authentication Successful", status: "success" });
          setTimeout(() => redirectByRoleId(res.data.roleId), 1000);
        } catch (err) {
          setResponseMessage({ text: err.response?.data?.message || "Invalid Credentials", status: "error" });
        }
  };

  const getInputStyle = (name) => ({
    ...styles.input,
    borderColor: fieldErrors[name] ? "#ef4444" : focusedField === name ? "#00ffaa" : "rgba(255,255,255,0.1)",
    boxShadow: fieldErrors[name] ? "0 0 10px rgba(239, 68, 68, 0.3)" : focusedField === name ? "0 0 15px rgba(0, 255, 170, 0.4)" : "none",
    transition: "all 0.3s ease"
  });

  return (
    <div style={styles.container}>
      <div style={styles.glow} />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={styles.card}>
        <h2 style={styles.title}>NeuroFleetX <span style={{color: '#6366f1'}}>Login</span></h2>

        {responseMessage && (
          <div style={{...styles.messageBox, color: responseMessage.status === "success" ? "#00ffaa" : "#ef4444"}}>
            {responseMessage.status === "success" ? "✓ " : "⚠ "} {responseMessage.text}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="email"
              placeholder="Neural Email"
              value={email}
              onFocus={() => { setFocusedField("email"); setFieldErrors(p => ({...p, email: null})); }}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => setEmail(e.target.value)}
              style={getInputStyle("email")}
            />
            {fieldErrors.email && <small style={styles.fieldError}>{fieldErrors.email}</small>}
          </div>

          <div style={styles.inputGroup}>
            <input
              type="password"
              placeholder="Access Password"
              value={password}
              onFocus={() => { setFocusedField("password"); setFieldErrors(p => ({...p, password: null})); }}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => setPassword(e.target.value)}
              style={getInputStyle("password")}
            />
            {fieldErrors.password && <small style={styles.fieldError}>{fieldErrors.password}</small>}
          </div>

          <div style={styles.roleGrid}>
            {[ {id:1, n:"Admin"}, {id:2, n:"Manager"}, {id:3, n:"Driver"}, {id:4, n:"User"} ].map(r => (
              <label key={r.id} style={{
                ...styles.roleCard,
                backgroundColor: roleId === r.id ? "#6366f1" : "rgba(255,255,255,0.05)",
                border: fieldErrors.role && !roleId ? "1px solid #ef4444" : "1px solid transparent"
              }}>
                <input type="radio" checked={roleId === r.id} onChange={() => { setRoleId(r.id); setFieldErrors(p => ({...p, role: null})); }} style={{display: 'none'}} />
                {r.n}
              </label>
            ))}
          </div>
          {fieldErrors.role && <small style={{...styles.fieldError, textAlign: 'center'}}>{fieldErrors.role}</small>}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={styles.button}>
            AUTHENTICATE
          </motion.button>
        </form>
        <p style={{ marginTop: "20px", color: "#94a3b8" }}>
          New operator? <Link to="/register" style={{color: '#6366f1', textDecoration: 'none'}}>Register Node</Link>
        </p>
      </motion.div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#05070a", fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' },
  glow: { position: 'absolute', width: '600px', height: '600px', background: 'rgba(99, 102, 241, 0.15)', filter: 'blur(100px)', borderRadius: '50%' },
  card: { background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(20px)", padding: "50px", borderRadius: "32px", width: "450px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center", zIndex: 1 },
  title: { marginBottom: "30px", color: "white", fontSize: "32px", fontWeight: "900", letterSpacing: "-1px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { position: "relative", textAlign: 'left' },
  input: { padding: "16px", fontSize: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "white", width: "100%", outline: 'none' },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' },
  roleCard: { padding: '12px', borderRadius: '12px', cursor: 'pointer', color: 'white', fontSize: '14px', fontWeight: 'bold', transition: '0.3s' },
  button: { marginTop: "20px", padding: "16px", fontSize: "16px", background: "#6366f1", color: "white", border: "none", borderRadius: "14px", cursor: "pointer", fontWeight: "900", boxShadow: "0 10px 20px rgba(99,102,241,0.3)" },
  messageBox: { marginBottom: "20px", fontWeight: 'bold' },
  fieldError: { color: "#ef4444", fontSize: "11px", marginTop: "5px", display: 'block', fontWeight: 'bold' },
};

export default Login;
















