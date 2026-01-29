import axios from "axios";

const api = axios.create({
  // Default to the Node/Express API; override with VITE_API_BASE_URL if deployed elsewhere
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1"
});

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
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw error;
        const refreshRes = await api.post("/auth/refresh", { refresh_token: refreshToken });
        const { access_token, refresh_token } = refreshRes.data?.data ?? {};
        if (access_token) localStorage.setItem("access_token", access_token);
        if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
