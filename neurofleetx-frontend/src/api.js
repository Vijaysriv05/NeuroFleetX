// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // backend base URL
  headers: {
    'Content-Type': 'application/json'
  },
   withCredentials: true // optional, if you use cookies/session
});

// Add JWT token automatically to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // get JWT from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // attach token
  }
  return config;
}, error => {
  return Promise.reject(error);
});
export const getProfile = () => api.get("/profile");
//export const login = (data) => api.post("/login", data);aava
export default api;




