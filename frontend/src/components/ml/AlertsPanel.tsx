import React from "react";
import { AlertItem } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const severityColor: Record<AlertItem["severity"], string> = {
  info: "var(--color-info)",
  warning: "var(--color-warning)",
  critical: "var(--color-critical)"
};

type Props = {
  alerts?: AlertItem[];   // made optional
  loading?: boolean;
  fillHeight?: boolean;
};

export const AlertsPanel: React.FC<Props> = ({ alerts, loading, fillHeight }) => {
  const safeAlerts: AlertItem[] = alerts ?? []; // null-safe
  const panelStyle = {
    padding: 20,
    height: fillHeight ? "100%" : "clamp(220px, 30vh, 260px)",
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 0
  };

  if (loading) {
    return (
      <div className="glass-card" style={panelStyle}>
        <Skeleton height="100%" />
      </div>
    );
  }

  if (safeAlerts.length === 0) {
    return (
      <div className="glass-card" style={panelStyle}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9999, border: "1px solid rgba(177, 158, 239, 0.18)", background: "rgba(11, 10, 21, 0.7)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)", width: "fit-content", color: "#f8fafc", fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-critical)", boxShadow: "0 0 8px var(--color-critical)" }} />
          ALERTS FEED
        </div>

        <div style={{ display: "grid", placeItems: "center", flex: 1, borderRadius: 12, border: "1px dashed rgba(255, 255, 255, 0.12)", background: "rgba(255,255,255,0.02)", color: "rgba(248, 250, 252, 0.82)", fontWeight: 600 }}>
          No active alerts
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={panelStyle}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9999, border: "1px solid rgba(177, 158, 239, 0.18)", background: "rgba(11, 10, 21, 0.7)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)", width: "fit-content", color: "#f8fafc", fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 16 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-critical)", boxShadow: "0 0 8px var(--color-critical)" }} />
        ALERTS FEED
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1, paddingRight: 4 }}>
        {safeAlerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              border: `1px solid color-mix(in srgb, ${severityColor[alert.severity]} 20%, transparent)`,
              borderRadius: 12,
              padding: 16,
              background: `color-mix(in srgb, ${severityColor[alert.severity]} 8%, transparent)`,
              flexShrink: 0
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: severityColor[alert.severity],
                    boxShadow: `0 0 6px ${severityColor[alert.severity]}`
                  }}
                />
                <span style={{ 
                  color: severityColor[alert.severity], 
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: "1px"
                }}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>

              <span
                style={{
                  color: "rgba(248, 250, 252, 0.5)",
                  fontSize: 13
                }}
              >
                {alert.timestamp
                  ? new Date(alert.timestamp).toLocaleTimeString()
                  : "—"}
              </span>
            </div>

            <div
              style={{
                color: "rgba(248, 250, 252, 0.8)",
                fontSize: 16,
                lineHeight: 1.55
              }}
            >
              {alert.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
