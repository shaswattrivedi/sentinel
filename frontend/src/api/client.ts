import axios from "axios";

const api = axios.create({
  // Default to the Node/Express API; override with VITE_API_BASE_URL if deployed elsewhere
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1"
});

// Circuit breaker to prevent infinite refresh loops
let refreshFailureCount = 0;
const MAX_REFRESH_FAILURES = 3;
const RESET_TIMEOUT = 60000; // Reset after 1 minute

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    // If we've exceeded max refresh failures, stop trying and force logout
    if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      // Redirect to login if not already there
      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.href = "/";
      }
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const refreshRes = await api.post("/auth/refresh", { refresh_token: refreshToken });
        const { access_token, refresh_token } = refreshRes.data?.data ?? {};
        
        if (access_token) {
          localStorage.setItem("access_token", access_token);
          // Reset failure count on successful refresh
          refreshFailureCount = 0;
        }
        if (refresh_token) {
          localStorage.setItem("refresh_token", refresh_token);
        }
        
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch (refreshError) {
        // Increment failure count
        refreshFailureCount++;
        
        // Clear tokens immediately
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        
        // Reset counter after timeout
        setTimeout(() => {
          refreshFailureCount = 0;
        }, RESET_TIMEOUT);
        
        // If we've hit the limit, redirect to login
        if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
          if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
            window.location.href = "/";
          }
        }
        
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const client = api;

export default api;
