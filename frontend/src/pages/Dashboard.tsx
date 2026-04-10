import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMLDashboardData } from "../hooks/useMLDashboardData";
import { FlowChart } from "@/components/ml/FlowChart";
import { RiskTimelineChart } from "@/components/ml/RiskTimelineChart";
import { AlertsPanel } from "@/components/ml/AlertsPanel";
import { MLInsightsPanel } from "@/components/ml/MLInsightsPanel";
import { CameraFeedPanel } from "@/components/ml/CameraFeedPanel";
import { ZoneMapPanel } from "@/components/ml/ZoneMapPanel";
import { CombinedRiskDensityCard } from "@/components/ml/CombinedRiskDensityCard";
import { resetDashboardState } from "@/api/dashboard";

type TabType = "OVERVIEW" | "TELEMETRY" | "OPERATIONS";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    overview,
    timeline,
    flow,
    alertsPanel,
    decision,
    isLoading,
    error,
    refresh,
    risk_score,
    system_status,
    zone_status,
    zone_data,
    annotated_frames,
    hardware
  } = useMLDashboardData();
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");
  const [resetting, setResetting] = useState(false);
  const [showCriticalBanner, setShowCriticalBanner] = useState(false);
  const prevSystemStatusRef = useRef(system_status);
  const alerts = alertsPanel;

  const riskLevelFromSystem =
    system_status === "CRITICAL" ? "HIGH" : system_status === "MODERATE" ? "MEDIUM" : "LOW";

  useEffect(() => {
    const prev = prevSystemStatusRef.current;
    if (system_status === "CRITICAL" && prev !== "CRITICAL") {
      setShowCriticalBanner(true);
      const alertBeep = new Audio(
        "data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAAAAP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/"
      );
      alertBeep.play().catch(() => {
        // Ignore autoplay restrictions; banner remains visible as primary signal.
      });
    }
    prevSystemStatusRef.current = system_status;
  }, [system_status]);

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
    { id: "TELEMETRY", label: "TELEMETRY", dotColor: "var(--color-warning)" },
    { id: "OPERATIONS", label: "OPERATIONS", dotColor: "var(--color-safe)" }
  ];

  const tabViewportHeight = "calc(100vh - 170px)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--font-dashboard)", color: "#f8fafc" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          justifyContent: "center",
          padding: "24px 24px 0",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            width: "100%",
            padding: "12px 10px 12px 24px",
            borderRadius: 9999,
            background: "rgba(11, 10, 21, 0.7)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            border: "1px solid rgba(177, 158, 239, 0.18)",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)"
          }}
        >
          <div>
            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              style={{
                color: "#f8fafc",
                textDecoration: "none",
                fontSize: 32,
                fontWeight: 800,
                fontFamily: "Performa, 'Plus Jakarta Sans', 'Satoshi', sans-serif",
                marginBottom: 2,
                letterSpacing: 1.5,
                lineHeight: 0.8,
                flexShrink: 0
              }}
            >
              SENTINEL
            </Link>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 22px",
                  borderRadius: 9999,
                  border: "1px solid transparent",
                  background: activeTab === tab.id ? "rgba(177, 158, 239, 0.1)" : "transparent",
                  borderColor: activeTab === tab.id ? "rgba(177, 158, 239, 0.2)" : "transparent",
                  color: activeTab === tab.id ? "#f8fafc" : "rgba(248, 250, 252, 0.7)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: 0.2,
                  transition: "all 0.25s ease",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = "#f8fafc";
                    e.currentTarget.style.background = "rgba(177, 158, 239, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = "rgba(248, 250, 252, 0.7)";
                    e.currentTarget.style.background = "transparent";
                  }
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

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", marginRight: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-safe)", boxShadow: "0 0 8px var(--color-safe)" }} />
              <span style={{ color: "rgba(248, 250, 252, 0.8)", fontSize: 14, fontWeight: 500 }}>{user?.email}</span>
            </div>

            {user?.organizationId === "SENTINELADMINUNIQUE" && (
              <Link
                to="/admin"
                style={{
                  fontFamily: "var(--font-ui)",
                  padding: "10px 18px",
                  borderRadius: 9999,
                  background: "rgba(127, 29, 29, 0.32)",
                  border: "1px solid rgba(248, 113, 113, 0.45)",
                  color: "#fecaca",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  letterSpacing: 0.4,
                  textTransform: "uppercase"
                }}
              >
                ● Admin
              </Link>
            )}

            <Link
              to="/analytics"
              style={{
                fontFamily: "var(--font-ui)",
                padding: "10px 18px",
                borderRadius: 9999,
                background: "rgba(249, 115, 22, 0.12)",
                border: "1px solid rgba(249, 115, 22, 0.35)",
                color: "#fed7aa",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                transition: "all 0.2s"
              }}
            >
              Analytics
            </Link>
            
            <button
              onClick={refresh}
              style={{
                padding: "10px 18px",
                borderRadius: 9999,
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
                padding: "10px 18px",
                borderRadius: 9999,
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
                padding: "10px 24px",
                borderRadius: 9999,
                background: "linear-gradient(135deg, rgba(177, 158, 239, 0.25) 0%, rgba(124, 107, 191, 0.18) 100%)",
                border: "1px solid rgba(177, 158, 239, 0.35)",
                color: "#f8fafc",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                marginRight: 4,
                transition: "all 0.2s"
              }}
            >
              Logout
            </button>
          </div>
        </header>
      </div>

      {error && (
        <div className="glass-card" style={{ padding: 12, margin: "16px 24px 0 24px", color: "var(--color-critical)" }}>
          {error}
        </div>
      )}

      {/* Tab Panels */}
      <div style={{ flex: 1, padding: 24, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {activeTab === "OVERVIEW" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <AnimatePresence>
              {showCriticalBanner && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="glass-card" style={{
                    background: "rgba(220, 38, 38, 0.28)",
                    border: "1px solid rgba(255, 80, 80, 0.45)",
                    boxShadow: "none",
                    color: "#ffffff",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 600,
                    marginBottom: 12
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#ef4444",
                        boxShadow: "0 0 12px #ef4444"
                      }} />
                      CRITICAL ALERT — Immediate Action Required
                    </div>
                    <button
                      onClick={() => setShowCriticalBanner(false)}
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ minHeight: 360, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9999, border: "1px solid rgba(177, 158, 239, 0.18)", background: "rgba(11, 10, 21, 0.7)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)", width: "fit-content", color: "#f8fafc", fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-info)", boxShadow: "0 0 8px var(--color-info)" }} />
                Live Camera Feed
              </div>
              <div style={{ borderRadius: 14, padding: 2, background: "transparent" }}>
                <CameraFeedPanel
                  annotatedFrames={annotated_frames}
                  zoneData={zone_data}
                  zoneStatus={zone_status}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9999, border: "1px solid rgba(177, 158, 239, 0.18)", background: "rgba(11, 10, 21, 0.7)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)", width: "fit-content", color: "#f8fafc", fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-warning)", boxShadow: "0 0 8px var(--color-warning)" }} />
                Zone Analysis & Risk Density
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch", height: "100%" }}>
                <div style={{ borderRadius: 14, background: "transparent", display: "flex" }}>
                  <ZoneMapPanel zoneStatus={zone_status} zoneData={zone_data} />
                </div>

                <div style={{ borderRadius: 14, background: "transparent", display: "flex" }}>
                  <CombinedRiskDensityCard
                    score={Number.isFinite(risk_score) ? risk_score : overview?.riskScore ?? null}
                    level={riskLevelFromSystem}
                    density={overview?.densityLevel ?? null}
                    hardware={hardware}
                    loading={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "TELEMETRY" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            <div style={{ height: tabViewportHeight, minHeight: 420, display: "flex", flexShrink: 0 }}>
              <RiskTimelineChart data={timeline} loading={isLoading} />
            </div>

            <div style={{ height: tabViewportHeight, minHeight: 420, display: "flex", flexShrink: 0 }}>
              <FlowChart data={flow} loading={isLoading} />
            </div>
          </div>
        )}

        {activeTab === "OPERATIONS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch", height: tabViewportHeight, minHeight: 420, flexShrink: 0 }}>
              {/* LEFT COLUMN */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
                <MLInsightsPanel hardware={hardware} timeline={timeline} alerts={alerts} loading={isLoading} />
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ height: "100%", minHeight: 0 }}>
                <AlertsPanel alerts={alerts} loading={isLoading} fillHeight />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
