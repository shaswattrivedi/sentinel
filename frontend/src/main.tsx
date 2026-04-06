import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Signup from "@/pages/Signup";
import Landing from "@/pages/Landing";
import Aurora from "@/components/Aurora";
import "./styles.css";

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message ?? "Unexpected UI error" };
  }

  componentDidCatch(error: Error) {
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div className="glass-card" style={{ width: "min(560px, 92vw)", padding: 20 }}>
            <div style={{ color: "var(--color-critical)", fontWeight: 700, marginBottom: 8 }}>Dashboard failed to render</div>
            <div style={{ color: "rgba(248, 250, 252, 0.85)", marginBottom: 14 }}>{this.state.message}</div>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 14px", borderRadius: 8 }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Clean up stale tokens on app start to prevent refresh loops
// This helps when backend restarts and old tokens become invalid
function cleanupStaleTokens() {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  
  if (accessToken || refreshToken) {
    try {
      // Try to decode token (basic check)
      if (accessToken) {
        const parts = accessToken.split('.');
        if (parts.length !== 3) {
          // Invalid JWT format
          console.warn("Invalid token format detected, clearing...");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
    } catch (err) {
      // If any error, clear tokens
      console.warn("Token validation failed, clearing...");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }
}

cleanupStaleTokens();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <div className="app-shell">
        <div className="aurora-bg">
          <Aurora
            colorStops={["#ccc9dc", "#B19EEF", "#324a5f"]}
            blend={0.35}
            amplitude={1.0}
            speed={1.1}
          />
        </div>
        <div className="app-content">
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </div>
      </div>
    </AppErrorBoundary>
  </React.StrictMode>
);
