import React from "react";
import { AlertItem } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const severityColor: Record<AlertItem["severity"], string> = {
  info: "#38bdf8",
  warning: "#f59e0b",
  critical: "#ef4444"
};

type Props = {
  alerts?: AlertItem[];   // 🔹 made optional
  loading?: boolean;
};

export const AlertsPanel: React.FC<Props> = ({ alerts, loading }) => {
  const safeAlerts: AlertItem[] = alerts ?? []; // 🔹 null-safe

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <Skeleton height={140} />
      </div>
    );
  }

  if (safeAlerts.length === 0) {
    return (
      <div
        className="glass-card"
        style={{ padding: 16, color: "#f8fafc" }}
      >
        No active alerts
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div
        style={{
          color: "rgba(248, 250, 252, 0.75)",
          fontSize: 12,
          marginBottom: 12
        }}
      >
        Alerts
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {safeAlerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              border: `1px solid ${severityColor[alert.severity]}30`,
              background: `${severityColor[alert.severity]}10`,
              borderRadius: 12,
              padding: 12
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: severityColor[alert.severity]
                  }}
                />
                <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>

              <span
                style={{
                  color: "rgba(248, 250, 252, 0.6)",
                  fontSize: 12
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
                marginTop: 6
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
