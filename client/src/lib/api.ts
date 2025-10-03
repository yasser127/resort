import axios from "axios";

const API_BASE = "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { Accept: "application/json" },
});


api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
