import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Signup from "@/pages/Signup";
import Landing from "@/pages/Landing";
import Aurora from "@/components/Aurora";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <div className="app-shell">
      <div className="aurora-bg">
        <Aurora
          colorStops={["#ccc9dc","#B19EEF","#324a5f"]}
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
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </div>
    </div>
  </React.StrictMode>
);
