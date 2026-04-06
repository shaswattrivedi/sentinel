import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useMLDashboardData } from "../hooks/useMLDashboardData";
import { RiskScoreIndicator } from "@/components/ml/RiskScoreIndicator";
import { CrowdDensityCard } from "@/components/ml/CrowdDensityCard";
import { FlowChart } from "@/components/ml/FlowChart";
import { RiskTimelineChart } from "@/components/ml/RiskTimelineChart";
import { AlertsPanel } from "@/components/ml/AlertsPanel";
import { EvacuationDecisionPanel } from "@/components/ml/EvacuationDecisionPanel";
import { HardwareStatusPanel } from "@/components/ml/HardwareStatusPanel";
import { MLTrendPanel } from "@/components/ml/MLTrendPanel";
import { resetDashboardState } from "@/api/dashboard";

type TabType = "OVERVIEW" | "ANALYTICS" | "OPERATIONS";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { overview, timeline, flow, alerts, decision, hardware, loading, error, refresh } = useMLDashboardData(5000);
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");
  const [resetting, setResetting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleResetDashboardState = async () => {
    const confirmed = window.confirm("Reset ML dashboard history and hardware snapshot?");
    if (!confirmed) return;

    setResetting(true);
    try {
      await resetDashboardState();
      await refresh();
    } catch (err) {
      console.error("Failed to reset dashboard state", err);
    } finally {
      setResetting(false);
    }
  };

  const tabs: Array<{ id: TabType; label: string; dotColor: string }> = [
    { id: "OVERVIEW", label: "OVERVIEW", dotColor: "var(--color-critical)" },
    { id: "ANALYTICS", label: "ANALYTICS", dotColor: "var(--color-warning)" },
    { id: "OPERATIONS", label: "OPERATIONS", dotColor: "var(--color-safe)" }
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        className="glass-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          margin: "24px 24px 0 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(20px)"
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
            <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Performa, 'Plus Jakarta Sans', 'Satoshi', sans-serif" }}>SENTINEL</h1>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? `3px solid var(--color-critical)` : "3px solid transparent",
                color: activeTab === tab.id ? "#f8fafc" : "rgba(248, 250, 252, 0.5)",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "1px",
                textTransform: "uppercase",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: tab.dotColor,
                boxShadow: activeTab === tab.id ? `0 0 8px ${tab.dotColor}` : "none"
              }} />
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-safe)", boxShadow: "0 0 8px var(--color-safe)" }} />
            <span style={{ color: "rgba(248, 250, 252, 0.8)", fontSize: 14, fontWeight: 500 }}>{user?.email}</span>
          </div>
          <button
            onClick={refresh}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#f8fafc",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s"
            }}
          >
            Refresh
          </button>
          <button
            onClick={handleResetDashboardState}
            disabled={resetting}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)",
              color: "var(--color-warning)",
              cursor: resetting ? "not-allowed" : "pointer",
              opacity: resetting ? 0.7 : 1,
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s"
            }}
          >
            {resetting ? "Resetting..." : "Reset Data"}
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "color-mix(in srgb, var(--color-critical) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-critical) 30%, transparent)",
              color: "var(--color-critical)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s"
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="glass-card" style={{ padding: 12, margin: "16px 24px 0 24px", color: "var(--color-critical)" }}>
          {error}
        </div>
      )}

      {/* Tab Panels */}
      <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {activeTab === "OVERVIEW" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "start" }}>
            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <RiskScoreIndicator score={overview?.riskScore ?? null} level={overview?.riskLevel ?? null} loading={loading} />
              
              {/* Compact Evacuation Summary */}
              {decision && (
                <div className="glass-card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ 
                      color: decision.state === "EVACUATE" ? "var(--color-critical)" : decision.state === "WARNING" ? "var(--color-warning)" : "var(--color-safe)",
                      fontWeight: 800,
                      fontSize: 16,
                      textTransform: "uppercase",
                      letterSpacing: "1px"
                    }}>
                      {decision.state}
                    </div>
                    {typeof decision.confidence === "number" && (
                      <div style={{ color: "rgba(248, 250, 252, 0.7)", fontSize: 14, fontWeight: 600 }}>
                        {(decision.confidence * 100).toFixed(0)}% confident
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CENTER COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <CrowdDensityCard density={overview?.densityLevel ?? null} hardware={hardware} loading={loading} />
            </div>

            {/* RIGHT COLUMN */}
            <div>
              <EvacuationDecisionPanel decision={decision} loading={loading} />
            </div>
          </div>
        )}

        {activeTab === "ANALYTICS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* ROW 1 - Full width */}
            <RiskTimelineChart data={timeline} loading={loading} />

            {/* ROW 2 - Two columns */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <FlowChart data={flow} loading={loading} />
              </div>
              <div style={{ minWidth: 0 }}>
                <MLTrendPanel hardware={hardware} loading={loading} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "OPERATIONS" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <HardwareStatusPanel hardware={hardware} loading={loading} />
              
              {/* ML Status - Compact summary */}
              {hardware?.trend_prediction && (
                <div className="glass-card" style={{ padding: 16 }}>
                  <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
                    ML STATUS
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 22 }}>
                        {hardware.trend_prediction.trend === "INCREASING" ? "↗" : hardware.trend_prediction.trend === "DECREASING" ? "↘" : "→"}
                      </span>
                      <span style={{ 
                        color: hardware.trend_prediction.prediction === "HIGH_RISK" ? "var(--color-critical)" : 
                               hardware.trend_prediction.prediction === "MODERATE_TREND" ? "var(--color-warning)" : "var(--color-safe)",
                        fontWeight: 800,
                           fontSize: 16,
                        textTransform: "uppercase",
                        letterSpacing: "1px"
                      }}>
                        {hardware.trend_prediction.prediction.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 12 }}>Density</div>
                      <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 18 }}>
                        {Math.max(0, Math.min(100, Number(hardware.trend_prediction.predicted_density) || 0)).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  {typeof hardware.trend_prediction.confidence === "number" && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 13 }}>Confidence</span>
                      <span style={{ color: "#f8fafc", fontWeight: 600, fontSize: 14 }}>
                        {(hardware.trend_prediction.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ position: "relative", minHeight: 0 }}>
              <div style={{ position: "absolute", inset: 0 }}>
                <AlertsPanel alerts={alerts} loading={loading} fillHeight />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
