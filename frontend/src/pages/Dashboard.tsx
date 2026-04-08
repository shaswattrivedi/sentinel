import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMLDashboardData } from "../hooks/useMLDashboardData";
import { FlowChart } from "@/components/ml/FlowChart";
import { RiskTimelineChart } from "@/components/ml/RiskTimelineChart";
import { AlertsPanel } from "@/components/ml/AlertsPanel";
import { EvacuationDecisionPanel } from "@/components/ml/EvacuationDecisionPanel";
import { MLInsightsPanel } from "@/components/ml/MLInsightsPanel";
import { MLTrendPanel } from "@/components/ml/MLTrendPanel";
import { CameraFeedPanel } from "@/components/ml/CameraFeedPanel";
import { ZoneMapPanel } from "@/components/ml/ZoneMapPanel";
import { CombinedRiskDensityCard } from "@/components/ml/CombinedRiskDensityCard";
import { resetDashboardState } from "@/api/dashboard";

type TabType = "OVERVIEW" | "ANALYTICS" | "OPERATIONS";

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
    { id: "ANALYTICS", label: "ANALYTICS", dotColor: "var(--color-warning)" },
    { id: "OPERATIONS", label: "OPERATIONS", dotColor: "var(--color-safe)" }
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AnimatePresence>
        {showCriticalBanner && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 100,
              width: "100%",
              background: "linear-gradient(90deg, rgba(127,29,29,0.95), rgba(220,38,38,0.95))",
              borderBottom: "1px solid rgba(254,202,202,0.35)",
              boxShadow: "0 10px 32px rgba(127,29,29,0.35)",
              color: "#fee2e2",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
              letterSpacing: 0.2
            }}
          >
            <span>CRITICAL ALERT — Immediate Action Required</span>
            <button
              onClick={() => setShowCriticalBanner(false)}
              style={{
                background: "rgba(0,0,0,0.2)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                fontWeight: 700
              }}
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
      <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {activeTab === "OVERVIEW" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="grid grid-cols-5" style={{ gap: 12 }}>
              <div className="glass-card" style={{ padding: "10px 12px" }}>
                <div style={{ color: "rgba(248,250,252,0.55)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>Risk Score</div>
                <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 18 }}>{Math.round(risk_score)}</div>
              </div>
              <div className="glass-card" style={{ padding: "10px 12px" }}>
                <div style={{ color: "rgba(248,250,252,0.55)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>System</div>
                <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 18 }}>{system_status}</div>
              </div>
              <div className="glass-card" style={{ padding: "10px 12px" }}>
                <div style={{ color: "rgba(248,250,252,0.55)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>Predicted Density</div>
                <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 18 }}>
                  {Math.round(hardware?.trend_prediction?.predicted_density ?? 0)}%
                </div>
              </div>
              <div className="glass-card" style={{ padding: "10px 12px" }}>
                <div style={{ color: "rgba(248,250,252,0.55)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>Zone 1</div>
                <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 18 }}>
                  {zone_data["zone-1"].cam_people_count} people
                </div>
              </div>
              <div className="glass-card" style={{ padding: "10px 12px" }}>
                <div style={{ color: "rgba(248,250,252,0.55)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>Zone 2</div>
                <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 18 }}>
                  {zone_data["zone-2"].cam_people_count} people
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr 1fr", gap: 12, alignItems: "start" }}>
            <div style={{ gridColumn: "span 2" }}>
              <CameraFeedPanel
                annotatedFrames={annotated_frames}
                zoneData={zone_data}
                zoneStatus={zone_status}
              />
            </div>

            <EvacuationDecisionPanel decision={decision} loading={isLoading} />

            <ZoneMapPanel zoneStatus={zone_status} zoneData={zone_data} />

            <div style={{ gridColumn: "span 2" }}>
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
        )}

        {activeTab === "ANALYTICS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* ROW 1 - Full width */}
            <RiskTimelineChart data={timeline} loading={isLoading} />

            {/* ROW 2 - Two columns */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <FlowChart data={flow} loading={isLoading} />
              </div>
              <div style={{ minWidth: 0 }}>
                <MLTrendPanel hardware={hardware} loading={isLoading} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "OPERATIONS" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="glass-card" style={{ padding: 16 }}>
                <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
                  ZONE HEALTH
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {(["zone-1", "zone-2"] as const).map((zoneKey) => {
                    const status = zone_status[zoneKey];
                    const validation = Math.max(0, Math.min(100, Number(zone_data[zoneKey].validation_score) || 0));
                    const hasFeed = !!annotated_frames[zoneKey];
                    const statusColor =
                      status === "CRITICAL" ? "var(--color-critical)" : status === "MODERATE" ? "var(--color-warning)" : "var(--color-safe)";

                    return (
                      <div
                        key={zoneKey}
                        style={{
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 800, letterSpacing: 0.4 }}>
                            {zoneKey === "zone-1" ? "ZONE 1" : "ZONE 2"}
                          </div>
                          <div
                            style={{
                              borderRadius: 999,
                              padding: "3px 8px",
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: 0.8,
                              color: statusColor,
                              border: `1px solid color-mix(in srgb, ${statusColor} 45%, transparent)`,
                              background: "rgba(0,0,0,0.22)",
                            }}
                          >
                            {status}
                          </div>
                        </div>

                        <div style={{ color: hasFeed ? "#86efac" : "rgba(148,163,184,0.9)", fontSize: 13, fontWeight: 700 }}>
                          {hasFeed ? "● Active" : "○ No Feed"}
                        </div>

                        <div style={{ color: "#f8fafc", fontSize: 13 }}>
                          People: <strong>{zone_data[zoneKey].cam_people_count}</strong>
                        </div>

                        <div>
                          <div style={{ color: "rgba(248,250,252,0.6)", fontSize: 11, marginBottom: 6 }}>Sensor Validation</div>
                          <div style={{ height: 8, borderRadius: 999, background: "rgba(15,23,42,0.7)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div
                              style={{
                                width: `${validation}%`,
                                height: "100%",
                                background: statusColor,
                                boxShadow: `0 0 12px color-mix(in srgb, ${statusColor} 60%, transparent)`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <MLInsightsPanel hardware={hardware} loading={isLoading} />
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ position: "relative", minHeight: 0 }}>
              <div style={{ position: "absolute", inset: 0 }}>
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
