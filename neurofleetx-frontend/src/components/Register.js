import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [responseMessage, setResponseMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setResponseMessage(null);
    setFieldErrors({});

    const missingFields = {};
    if (!username.trim()) missingFields.username = "Name Required";
    if (!email.trim()) {
      missingFields.email = "Email Required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      missingFields.email = "Invalid Format";
    }
    if (!password.trim()) {
      missingFields.password = "Password Required";
    } else if (password.length < 8) {
      missingFields.password = "Min 8 Chars";
    }
    if (!roleId) missingFields.role = "Role Required";

    if (Object.keys(missingFields).length > 0) {
      setFieldErrors(missingFields);
      setResponseMessage({ text: "Missing Parameters", status: "error" });
      return;
    }

    try {
      await api.post("/register", { username, email, password, roleId });
      setResponseMessage({ text: "Registration Successful", status: "success" });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setResponseMessage({ text: err.response?.data?.message || "Registration Denied", status: "error" });
    }
  };

  const getStyle = (name) => ({
    ...styles.input,
    borderColor: fieldErrors[name] ? "#ef4444" : focusedField === name ? "#00ffaa" : "rgba(255,255,255,0.1)",
    boxShadow: fieldErrors[name] ? "0 0 10px rgba(239, 68, 68, 0.3)" : focusedField === name ? "0 0 15px rgba(0, 255, 170, 0.4)" : "none",
  });

  return (
    <div style={styles.container}>
      <div style={styles.glowOverlay} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
        <h2 style={styles.title}>REGISTRATION <span style={{color: '#6366f1'}}>NODE</span></h2>

        {responseMessage && (
          <div style={{
            ...styles.messageBox,
            color: responseMessage.status === "success" ? "#00ffaa" : "#ef4444",
            border: `1px solid ${responseMessage.status === "success" ? "#10b98133" : "#ef444433"}`
          }}>
            {responseMessage.status === "success" ? "✓" : "⚠"} {responseMessage.text}
          </div>
        )}

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <input type="text" placeholder="Operator Name" value={username} onFocus={() => { setFocusedField("username"); setFieldErrors(p => ({...p, username: null})); }} onBlur={() => setFocusedField(null)} style={getStyle("username")} onChange={(e) => setUsername(e.target.value)} />
            {fieldErrors.username && <small style={styles.fieldError}>{fieldErrors.username}</small>}
          </div>

          <div style={styles.inputGroup}>
            <input type="email" placeholder="Neural Email" value={email} onFocus={() => { setFocusedField("email"); setFieldErrors(p => ({...p, email: null})); }} onBlur={() => setFocusedField(null)} style={getStyle("email")} onChange={(e) => setEmail(e.target.value)} />
            {fieldErrors.email && <small style={styles.fieldError}>{fieldErrors.email}</small>}
          </div>

          <div style={styles.inputGroup}>
            <input type="password" placeholder="System Password" value={password} onFocus={() => { setFocusedField("password"); setFieldErrors(p => ({...p, password: null})); }} onBlur={() => setFocusedField(null)} style={getStyle("password")} onChange={(e) => setPassword(e.target.value)} />
            {fieldErrors.password && <small style={styles.fieldError}>{fieldErrors.password}</small>}
          </div>

          <div style={styles.roleContainer}>
            <p style={styles.roleLabel}>ASSIGN_INTERFACE_ROLE:</p>
            <div style={styles.roleGrid}>
              {[ {id:1, n:"Admin"}, {id:2, n:"Manager"}, {id:3, n:"Driver"}, {id:4, n:"User"} ].map(r => (
                <label key={r.id} style={{
                    ...styles.roleCard,
                    backgroundColor: roleId === r.id ? "#6366f1" : "rgba(255,255,255,0.05)",
                    borderColor: roleId === r.id ? "#818cf8" : fieldErrors.role ? "#ef4444" : "rgba(255,255,255,0.1)"
                }}>
                  <input type="radio" checked={roleId === r.id} onChange={() => { setRoleId(r.id); setFieldErrors(p => ({...p, role: null})); }} style={{display: 'none'}} />
                  {r.n}
                </label>
              ))}
            </div>
            {fieldErrors.role && <small style={styles.fieldError}>{fieldErrors.role}</small>}
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={styles.button}>
            INITIALIZE IDENTITY
          </motion.button>
        </form>
        <p style={{ marginTop: "25px", color: "#64748b", fontSize: "14px" }}>
          Registered Operator? <Link to="/login" style={{color: '#6366f1', textDecoration: 'none', fontWeight: 'bold'}}>Access Matrix</Link>
        </p>
      </motion.div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#05070a", fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' },
  glowOverlay: { position: 'absolute', width: '1000px', height: '1000px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', top: '-20%', right: '-10%' },
  card: { background: "rgba(255, 255, 255, 0.02)", backdropFilter: "blur(20px)", padding: "50px", borderRadius: "40px", width: "500px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", zIndex: 1 },
  title: { marginBottom: "30px", color: "white", fontSize: "32px", fontWeight: "900", letterSpacing: '-1.5px', fontStyle: 'italic' },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  inputGroup: { position: "relative", textAlign: 'left' },
  input: { padding: "16px 20px", fontSize: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "white", width: "100%", outline: 'none', transition: 'all 0.3s' },
  roleContainer: { textAlign: "left", marginTop: "10px" },
  roleLabel: { color: "#475569", fontSize: "10px", fontWeight: "900", letterSpacing: "2px", marginBottom: "12px" },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  roleCard: { padding: '14px', borderRadius: '12px', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 'bold', border: '1px solid transparent', textAlign: 'center', transition: '0.3s' },
  button: { marginTop: "20px", padding: "18px", fontSize: "16px", background: "#6366f1", color: "white", border: "none", borderRadius: "18px", cursor: "pointer", fontWeight: "900", boxShadow: "0 15px 30px rgba(99,102,241,0.3)" },
  messageBox: { padding: "15px", borderRadius: "12px", fontSize: "14px", marginBottom: "25px", fontWeight: 'bold', background: "rgba(0,0,0,0.2)" },
  fieldError: { color: "#ef4444", fontSize: "11px", marginTop: "6px", fontWeight: 'bold' },
};

export default Register;