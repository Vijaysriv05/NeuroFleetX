import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Matches your Spring Boot server port
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attaches the JWT Bearer token from localStorage to every outgoing request.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * RESPONSE INTERCEPTOR
 * Intercepts 401 errors to redirect to login if the token expires.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- AUTH & PROFILE ---
export const login = (data) => api.post("/login", data);
export const register = (data) => api.post("/register", data);
export const getProfile = () => api.get("/profile");
export const updateProfile = (data) => api.put("/profile/update", data);

// --- DRIVER DASHBOARD OPERATIONS ---
export const getDriverTripData = (userId) => api.get(`/driver/trip-data/${userId}`);

// Trip controls
export const confirmPickup = (userId) => api.put(`/driver/trip/status/${userId}`);
export const confirmDrop = (userId) => api.put(`/driver/trip/drop/${userId}`);

// --- EMERGENCY & ANOMALY OPERATIONS (FIXED) ---

/**
 * Sends an empty object {} to satisfy Spring Boot's @RequestBody requirement.
 * Prevents "Required request body is missing" 500 error.
 */
export const triggerEmergencySOS = (userId) =>
  api.post(`/driver/emergency/${userId}`, {});

/**
 * Maps the issue text to 'description' and sets a default status.
 * Ensure 'description' matches the field name in your Java Maintenance entity.
 */
export const reportMaintenanceIssue = (userId, issueText) =>
  api.post(`/driver/maintenance/${userId}`, {
    description: issueText,
    status: "PENDING"
  });

export const getDriverMissionLogs = (userId) => api.get(`/driver/mission-logs/${userId}`);

// --- VEHICLE MANAGEMENT ---
export const getMasterVehicles = () => api.get("/vehicles/master");
export const registerVehicleRequest = (data) => api.post("/vehicles/register", data);
export const getCustomerFleet = (userId) => api.get(`/vehicles/my-fleet/${userId}`);

// --- ADMIN & MANAGER OPERATIONS ---
export const getVehicleStats = () => api.get("/vehicles/stats");
export const getActiveTrips = () => api.get("/trips/active");
export const getDriversStatus = () => api.get("/drivers/status");
export const getManagerStats = () => api.get("/manager/stats");
export const getAuditLogs = () => api.get("/admin/logs");
export const authorizeVehicleService = (id) => api.put(`/vehicles/authorize-service/${id}`);
export const redistributeUnits = (data) => api.post("/redistribute", data);

// --- FEEDBACK SYSTEM ---
export const getAllFeedback = () => api.get("/feedback/all");
export const submitFeedback = (data) => api.post("/feedback/submit", data);

export default api;