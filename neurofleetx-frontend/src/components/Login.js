import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(null);

  const [responseMessage, setResponseMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [firstSubmit, setFirstSubmit] = useState(true);

  // ✅ ROLE ID BASED REDIRECT (UNCHANGED)
  const redirectByRoleId = (roleId) => {
    if (roleId === 1) navigate("/admin/dashboard");
    else if (roleId === 2) navigate("/manager/dashboard");
    else if (roleId === 3) navigate("/driver/dashboard");
    else if (roleId === 4) navigate("/customer/dashboard");
    else navigate("/login");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setResponseMessage(null);
    setFieldErrors({});

    const missingFields = {};

    // -------- Email Validation --------
    if (!email) {
      missingFields.email = "Please fill this field";
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        missingFields.email = "Please enter a valid email";
      }
    }

    // -------- Password Validation --------
    if (!password) {
      missingFields.password = "Please fill this field";
    } else if (password.length < 8) {
      setResponseMessage({
        text: "Password must be at least 8 characters",
        status: "error",
      });
      return;
    }

    // -------- Role Validation --------
    if (!roleId) {
      missingFields.role = "Please select a role";
    }

    // -------- Handle Validation Errors --------
    if (Object.keys(missingFields).length > 0) {
      setFieldErrors(missingFields);

      const msg = firstSubmit
        ? "Please fill all required fields"
        : `Please fill: ${Object.keys(missingFields).join(", ")}`;

      setResponseMessage({
        text: msg,
        status: "error",
      });

      setFirstSubmit(false);
      return;
    }

    // -------- API CALL (UNCHANGED) --------
    try {
      const res = await api.post("/login", {
        email,
        password,
        roleId,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("roleId", res.data.roleId);
      localStorage.setItem("email", email);

      setResponseMessage({
        text: res.data.message || "Login successful",
        status: "success",
      });

      // ✅ REDIRECT USING ROLE ID (UNCHANGED)
      setTimeout(() => {
        redirectByRoleId(res.data.roleId);
      }, 800);

    } catch (err) {
      setResponseMessage({
        text: err.response?.data?.message || "Email or Password is incorrect",
        status: "error",
      });
    }
  };

  const getSymbol = (status) => {
    if (status === "success") return "✅";
    if (status === "error") return "❌";
    return "";
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>LOGIN</h2>

        {responseMessage && (
          <div
            style={{
              ...styles.messageBox,
              backgroundColor:
                responseMessage.status === "success" ? "#e6ffea" : "#ffe6e6",
              color:
                responseMessage.status === "success" ? "#007a33" : "#b30000",
            }}
          >
            {getSymbol(responseMessage.status)} {responseMessage.text}
          </div>
        )}

        <form noValidate onSubmit={handleLogin} style={styles.form}>
          {/* Email */}
          <div style={{ position: "relative" }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                ...styles.input,
                animation: fieldErrors.email ? "blink 0.5s step-start 3" : "none",
                borderColor: fieldErrors.email ? "#b30000" : "#ccc",
              }}
            />
            {fieldErrors.email && (
              <small style={styles.fieldError}>{fieldErrors.email}</small>
            )}
          </div>

          {/* Password */}
          <div style={{ position: "relative" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                ...styles.input,
                animation: fieldErrors.password ? "blink 0.5s step-start 3" : "none",
                borderColor: fieldErrors.password ? "#b30000" : "#ccc",
              }}
            />
            {fieldErrors.password && (
              <small style={styles.fieldError}>{fieldErrors.password}</small>
            )}
          </div>

          {/* Role */}
          <div style={styles.roleContainer}>
            <label style={styles.roleLabel}>Role:</label>

            <label>
              <input
                type="radio"
                checked={roleId === 1}
                onChange={() => setRoleId(1)}
              />{" "}
              Admin
            </label>

            <label style={styles.radioMargin}>
              <input
                type="radio"
                checked={roleId === 2}
                onChange={() => setRoleId(2)}
              />{" "}
              Fleet Manager
            </label>

            <label style={styles.radioMargin}>
              <input
                type="radio"
                checked={roleId === 3}
                onChange={() => setRoleId(3)}
              />{" "}
              Driver
            </label>

            <label style={styles.radioMargin}>
              <input
                type="radio"
                checked={roleId === 4}
                onChange={() => setRoleId(4)}
              />{" "}
              Customer
            </label>

            {fieldErrors.role && (
              <small style={styles.fieldError}>{fieldErrors.role}</small>
            )}
          </div>

          <button type="submit" style={styles.button}>
            LOGIN
          </button>
        </form>

        <p style={{ marginTop: "15px", fontSize: "16px" }}>
          Don’t have an account? <Link to="/register">Please register</Link>
        </p>
      </div>

      <style>
        {`
          @keyframes blink {
            0% { border-color: #b30000; }
            50% { border-color: #fff; }
            100% { border-color: #b30000; }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#e6f0ff",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "#d9e6ff",
    padding: "50px",
    borderRadius: "16px",
    width: "450px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    textAlign: "center",
  },
  title: {
    marginBottom: "35px",
    color: "#0b1f4c",
    fontSize: "28px",
  },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  input: {
    padding: "14px",
    fontSize: "18px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    width: "100%",
  },
  roleContainer: {
    textAlign: "left",
    marginTop: "10px",
    fontSize: "16px",
    position: "relative",
  },
  roleLabel: { fontWeight: "bold", display: "block", marginBottom: "8px" },
  radioMargin: { marginLeft: "20px" },
  button: {
    marginTop: "25px",
    padding: "14px",
    fontSize: "18px",
    background: "linear-gradient(90deg,#4a6cf7,#1a3578)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  messageBox: {
    padding: "12px",
    borderRadius: "8px",
    fontSize: "16px",
    marginBottom: "20px",
  },
  fieldError: {
    color: "#b30000",
    fontSize: "14px",
    position: "absolute",
    bottom: "-20px",
    left: "0",
  },
};

export default Login;

































