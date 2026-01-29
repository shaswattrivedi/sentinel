import axios from "axios";

// Separate client for ML FastAPI service (default localhost:8000, no path prefix)
const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_BASE_URL ?? "http://localhost:8000"
});

// Optionally forward auth token if the ML service expects it
mlApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default mlApi;
