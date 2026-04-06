import React from "react";
import { AlertItem } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const severityColor: Record<AlertItem["severity"], string> = {
  info: "var(--color-info)",
  warning: "var(--color-warning)",
  critical: "var(--color-critical)"
};

type Props = {
  alerts?: AlertItem[];   // 🔹 made optional
  loading?: boolean;
  fillHeight?: boolean;
};

export const AlertsPanel: React.FC<Props> = ({ alerts, loading, fillHeight }) => {
  const safeAlerts: AlertItem[] = alerts ?? []; // 🔹 null-safe
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
      <div
        className="glass-card"
        style={{ ...panelStyle, color: "#f8fafc" }}
      >
        No active alerts
      </div>
    );
  }

  return (
    <div className="glass-card" style={panelStyle}>
      <div
        style={{
          color: "rgba(248, 250, 252, 0.5)",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "2px",
          marginBottom: 16
        }}
      >
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
