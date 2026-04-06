import React from "react";
import { RiskLevel, HardwareStatusResponse } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const densityText: Record<RiskLevel, { label: string; color: string; desc: string }> = {
  LOW: { label: "Low", color: "var(--color-safe)", desc: "Plenty of space; traffic is light." },
  MEDIUM: { label: "Medium", color: "var(--color-warning)", desc: "Moderate crowding; monitor flows." },
  HIGH: { label: "High", color: "var(--color-critical)", desc: "Heavy crowding; consider mitigation." }
};

type Props = {
  density: RiskLevel | null;
  hardware?: HardwareStatusResponse | null;
  loading?: boolean;
};

export const CrowdDensityCard: React.FC<Props> = ({ density, hardware, loading }) => {
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

  const info = densityText[density] ?? densityText.LOW;

  return (
    <>
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
          CROWD DENSITY
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 800, 
              color: info.color, 
              textTransform: "uppercase",
              textShadow: `0 0 10px color-mix(in srgb, ${info.color} 50%, transparent)`
            }}>{info.label.toUpperCase()}</div>
            <div style={{ color: "rgba(248, 250, 252, 0.65)", marginTop: 6, fontSize: 14, maxWidth: 180, lineHeight: 1.45 }}>
              {info.desc}
            </div>
          </div>
          <div style={{ position: "relative", width: 48, height: 48 }}>
            <svg width={48} height={48} style={{ filter: `drop-shadow(0 0 4px ${info.color}80)` }}>
              <circle cx={24} cy={24} r={18} stroke="rgba(255,255,255,0.05)" strokeWidth={4} fill="none" />
              <circle 
                cx={24} cy={24} r={18} 
                stroke={info.color} strokeWidth={4} fill="none" 
                strokeDasharray="113" 
                strokeDashoffset={density === 'LOW' ? 75 : density === 'MEDIUM' ? 37 : 5} 
                strokeLinecap="round" 
                style={{ transform: "rotate(-90deg)", transformOrigin: "24px 24px", transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
          </div>
        </div>
      </div>

      {hardware?.zone_status && (
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
            ZONE STATUS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(hardware.zone_status).map(([zone, status]) => {
              const strVal = String(status).toUpperCase();
              const safe = strVal === "SAFE" || strVal === "NORMAL" || strVal === "LOW";
              const color = safe ? "var(--color-safe)" : "var(--color-critical)";
              return (
                <div key={zone} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, textTransform: "uppercase", color: "rgba(248, 250, 252, 0.8)", letterSpacing: "1px" }}>{zone}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#f8fafc", fontSize: 14, fontWeight: 600 }}>
                      {strVal}
                    </span>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      background: `color-mix(in srgb, ${color} 15%, transparent)`,
                      color,
                      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                      letterSpacing: "1px"
                    }}>
                      {safe ? "SAFE" : "CRITICAL"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
