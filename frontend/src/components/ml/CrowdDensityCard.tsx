import React from "react";
import { RiskLevel } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const densityText: Record<RiskLevel, { label: string; color: string; desc: string }> = {
  LOW: { label: "Low", color: "#22c55e", desc: "Plenty of space; traffic is light." },
  MEDIUM: { label: "Medium", color: "#f59e0b", desc: "Moderate crowding; monitor flows." },
  HIGH: { label: "High", color: "#ef4444", desc: "Heavy crowding; consider mitigation." }
};

type Props = {
  density: RiskLevel | null;
  loading?: boolean;
};

export const CrowdDensityCard: React.FC<Props> = ({ density, loading }) => {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <Skeleton height={72} />
      </div>
    );
  }

  if (!density) {
    return (
      <div className="glass-card" style={{ padding: 16, color: "#f8fafc" }}>Density data unavailable</div>
    );
  }

  const info = densityText[density];

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "rgba(248, 250, 252, 0.75)", fontSize: 12 }}>Crowd Density</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: info.color }}>{info.label.toUpperCase()}</div>
          <div style={{ color: "rgba(248, 250, 252, 0.65)", marginTop: 6, fontSize: 13 }}>{info.desc}</div>
        </div>
        <div
          style={{
            minWidth: 90,
            textAlign: "center",
            padding: "12px 10px",
            borderRadius: 12,
            border: `1px solid ${info.color}30`,
            background: `${info.color}10`,
            color: info.color,
            fontWeight: 600
          }}
        >
          {info.label}
        </div>
      </div>
    </div>
  );
};
