import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useMLDashboardData } from "../hooks/useMLDashboardData";
import { RiskScoreIndicator } from "@/components/ml/RiskScoreIndicator";
import { CrowdDensityCard } from "@/components/ml/CrowdDensityCard";
import { FlowChart } from "@/components/ml/FlowChart";
import { RiskTimelineChart } from "@/components/ml/RiskTimelineChart";
import { AlertsPanel } from "@/components/ml/AlertsPanel";
import { EvacuationDecisionPanel } from "@/components/ml/EvacuationDecisionPanel";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { overview, timeline, flow, alerts, decision, loading, error, refresh } = useMLDashboardData(15000);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={{ padding: 24, minHeight: "100vh" }}>
      <header
        className="glass-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          marginBottom: 20
        }}
      >
        <div>
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            style={{ color: "#f8fafc", textDecoration: "none" }}
          >
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: 0.5 }}>SENTINEL</h1>
          </Link>
          <div style={{ color: "rgba(248, 250, 252, 0.6)", marginTop: 4 }}>Real-time ML-driven situational awareness</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "rgba(248, 250, 252, 0.8)", fontSize: 14 }}>{user?.email}</span>
          <button
            onClick={refresh}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(177, 158, 239, 0.25)",
              color: "#f8fafc",
              cursor: "pointer"
            }}
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(177, 158, 239, 0.25)",
              color: "#f8fafc",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="glass-card" style={{ padding: 12, marginBottom: 16, color: "#f87171" }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 16
        }}
      >
        <RiskScoreIndicator score={overview?.riskScore ?? null} level={overview?.riskLevel ?? null} loading={loading} />
        <CrowdDensityCard density={overview?.densityLevel ?? null} loading={loading} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 16,
          marginBottom: 16
        }}
      >
        <FlowChart data={flow} loading={loading} />
        <RiskTimelineChart data={timeline} loading={loading} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16
        }}
      >
        <AlertsPanel alerts={alerts} loading={loading} />
        <EvacuationDecisionPanel decision={decision} loading={loading} />
      </div>
    </div>
  );
};

export default Dashboard;
