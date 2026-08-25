import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const signup = (data) => api.post("/auth/signup", data).then((r) => r.data);
export const login = (data) => api.post("/auth/login", data).then((r) => r.data);

// Resources
export const getResources = () => api.get("/resources").then((r) => r.data);
export const getResource = (id) => api.get(`/resources/${id}`).then((r) => r.data);
export const getResourceBookings = (id, date) =>
  api.get(`/resources/${id}/bookings`, { params: { date } }).then((r) => r.data);

// Bookings
export const createBooking = (data) => api.post("/bookings", data).then((r) => r.data);
export const getMyBookings = () => api.get("/bookings/mine").then((r) => r.data);
export const cancelBooking = (id) => api.delete(`/bookings/${id}`).then((r) => r.data);
