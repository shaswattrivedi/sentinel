import React, { useEffect, useState } from "react";
import { RiskLevel, HardwareStatusResponse } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const levelColor: Record<RiskLevel, string> = {
  LOW: "var(--color-safe)",
  MEDIUM: "var(--color-warning)",
  HIGH: "var(--color-critical)"
};

const levelLabel: Record<RiskLevel, string> = {
  LOW: "Safe",
  MEDIUM: "Warning",
  HIGH: "Danger"
};

const densityText: Record<RiskLevel, { label: string; color: string; desc: string }> = {
  LOW: { label: "Low", color: "var(--color-safe)", desc: "Light traffic" },
  MEDIUM: { label: "Medium", color: "var(--color-warning)", desc: "Moderate crowding" },
  HIGH: { label: "High", color: "var(--color-critical)", desc: "Heavy crowding" }
};

type Props = {
  score: number | null;
  level: RiskLevel | null;
  density: RiskLevel | null;
  hardware?: HardwareStatusResponse | null;
  loading?: boolean;
};

export const CombinedRiskDensityCard: React.FC<Props> = ({ score, level, density, hardware, loading }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (score !== null) {
      const t = setTimeout(() => setAnimatedScore(score), 100);
      return () => clearTimeout(t);
    }
  }, [score]);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 16, gridRow: "span 2" }}>
        <Skeleton height={200} />
      </div>
    );
  }

  if (score == null || !level || !density) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ color: "#f8fafc" }}>Data unavailable</div>
      </div>
    );
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(animatedScore, 100));
  const offset = circumference - (progress / 100) * circumference;
  const riskColor = levelColor[level];

  const info = densityText[density] ?? densityText.LOW;

  return (
    <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20, width: "100%", height: "100%", flex: 1, justifyContent: "center" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9999, border: "1px solid rgba(177, 158, 239, 0.18)", background: "rgba(11, 10, 21, 0.7)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)", width: "fit-content", color: "#f8fafc", fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-warning)", boxShadow: "0 0 8px var(--color-warning)" }} />
          RISK & DENSITY
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "center" }}>
        
        {/* Left Column: Risk */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width={100} height={100} style={{ flexShrink: 0 }}>
            <circle cx={50} cy={50} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={10} fill="none" />
            <circle
              cx={50} cy={50} r={radius}
              stroke={riskColor} strokeWidth={10} fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                transform: "rotate(-90deg)",
                transformOrigin: "50px 50px",
                filter: `drop-shadow(0 0 6px ${riskColor}80)`
              }}
            />
            <text x="50" y="55" textAnchor="middle" fill="#f8fafc" fontSize="24" fontWeight="700">
              {Math.round(animatedScore)}
            </text>
            <text x="50" y="72" textAnchor="middle" fill="rgba(248, 250, 252, 0.5)" fontSize="10" fontWeight="600">
              RISK
            </text>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: riskColor, fontSize: 18, fontWeight: 800, textTransform: "uppercase", textShadow: `0 0 10px ${riskColor}60` }}>
              {levelLabel[level]}
            </div>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 13 }}>
              System Status
            </div>
          </div>
        </div>

        {/* Right Column: Density */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, borderLeft: "1px solid rgba(255,255,255,0.05)", paddingLeft: 20 }}>
          <div style={{ position: "relative", width: 50, height: 50 }}>
            <svg width={50} height={50} style={{ filter: `drop-shadow(0 0 4px ${info.color}80)` }}>
              <circle cx={25} cy={25} r={20} stroke="rgba(255,255,255,0.05)" strokeWidth={5} fill="none" />
              <circle 
                cx={25} cy={25} r={20} 
                stroke={info.color} strokeWidth={5} fill="none" 
                strokeDasharray="125" 
                strokeDashoffset={density === 'LOW' ? 84 : density === 'MEDIUM' ? 42 : 5} 
                strokeLinecap="round" 
                style={{ transform: "rotate(-90deg)", transformOrigin: "25px 25px", transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: info.color, fontSize: 18, fontWeight: 800, textTransform: "uppercase", textShadow: `0 0 10px color-mix(in srgb, ${info.color} 50%, transparent)` }}>
              {info.label} Density
            </div>
            <div style={{ color: "rgba(248, 250, 252, 0.65)", fontSize: 13 }}>
              {info.desc}
            </div>
          </div>
        </div>

      </div>

      {/* Optional Zone Status row embedded underneath */}
      {hardware?.zone_status && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9999, border: "1px solid rgba(177, 158, 239, 0.18)", background: "rgba(11, 10, 21, 0.7)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)", width: "fit-content", color: "#f8fafc", fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-safe)", boxShadow: "0 0 8px var(--color-safe)" }} />
            ZONE STATUS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {Object.entries(hardware.zone_status).map(([zone, status]) => {
              const strVal = String(status).toUpperCase();
              const safeState = strVal === "SAFE";
              const moderateState = strVal === "MODERATE";
              const color = safeState ? "var(--color-safe)" : moderateState ? "var(--color-warning)" : "var(--color-critical)";

              return (
                <div key={zone} style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, textTransform: "uppercase", color: "rgba(248, 250, 252, 0.7)", letterSpacing: "1px", fontWeight: 700 }}>{zone}</span>
                    <div style={{ fontSize: 10, color: "rgba(248, 250, 252, 0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>Super Node</div>
                  </div>
                  <span style={{ color, fontSize: 13, fontWeight: 800, textShadow: `0 0 6px ${color}80` }}>
                    {strVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
