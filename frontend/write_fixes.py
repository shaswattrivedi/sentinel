import os

HARDWARE_TSX = """import React from "react";
import { HardwareStatusResponse, HardwareCommands } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

type Props = {
  hardware: HardwareStatusResponse | null;
  loading?: boolean;
};

export const HardwareStatusPanel: React.FC<Props> = ({ hardware, loading }) => {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <Skeleton height={120} />
      </div>
    );
  }

  if (!hardware) {
    return (
      <div className="glass-card" style={{ padding: 16, color: "#f8fafc" }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
          TRAFFIC SIGNALS
        </div>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 13 }}>Hardware data unavailable</div>
      </div>
    );
  }

  const zones = ["z2", "z3"] as const;
  const evacBuzzerActive = hardware.hardware_commands?.z2_buzzer || hardware.hardware_commands?.z3_buzzer;

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
        TRAFFIC SIGNALS
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {zones.map((zone) => {
          const ledStr = hardware.hardware_commands?.[`${zone}_led` as keyof HardwareCommands];
          const isSafe = ledStr === "green" || !ledStr;
          const ledRColor = isSafe ? "rgba(255,255,255,0.05)" : "var(--color-critical)";
          const ledGColor = isSafe ? "var(--color-safe)" : "rgba(255,255,255,0.05)";
          
          return (
            <div key={`hw-${zone}`} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "rgba(248, 250, 252, 0.7)", fontSize: 10, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>{zone.toUpperCase()} LEDs</div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: ledRColor,
                  border: `2px solid color-mix(in srgb, ${ledRColor} 40%, transparent)`,
                  boxShadow: !isSafe ? `0 0 12px ${ledRColor}` : "none",
                  transition: "all 0.3s"
                }} title={`${zone} Red LED`} />
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: ledGColor,
                  border: `2px solid color-mix(in srgb, ${ledGColor} 40%, transparent)`,
                  boxShadow: isSafe ? `0 0 12px ${ledGColor}` : "none",
                  transition: "all 0.3s"
                }} title={`${zone} Green LED`} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "rgba(248, 250, 252, 0.7)", fontSize: 10, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>EVAC BUZZER</div>
          <div style={{ color: evacBuzzerActive ? "var(--color-critical)" : "var(--color-safe)", fontSize: 12, fontWeight: 800, marginTop: 4, letterSpacing: "1px" }}>
            {evacBuzzerActive ? "ACTIVE" : "STANDBY"}
          </div>
        </div>
        <div style={{ width: 44, height: 24, borderRadius: 12, background: evacBuzzerActive ? "var(--color-critical)" : "rgba(255,255,255,0.1)", position: "relative" }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: "#fff",
            position: "absolute", top: 2, left: evacBuzzerActive ? 22 : 2, transition: "all 0.3s"
          }} />
        </div>
      </div>
    </div>
  );
};
"""

CROWD_DENSITY_TSX = """import React from "react";
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

  const info = densityText[density];

  return (
    <>
      <div className="glass-card" style={{ padding: 16, display: "flex", flexDirection: "column" }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
          CROWD DENSITY
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ 
              fontSize: 24, 
              fontWeight: 800, 
              color: info.color, 
              textTransform: "uppercase",
              textShadow: `0 0 10px color-mix(in srgb, ${info.color} 50%, transparent)`
            }}>{info.label.toUpperCase()}</div>
            <div style={{ color: "rgba(248, 250, 252, 0.65)", marginTop: 4, fontSize: 12, maxWidth: 140 }}>
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
          <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
            ZONE STATUS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(hardware.zone_status).map(([zone, statusStr]) => {
              const status = typeof statusStr === "string" ? statusStr.toUpperCase() : "UNKNOWN";
              const safe = status === "LOW" || status === "NORMAL";
              const color = safe ? "var(--color-safe)" : "var(--color-critical)";
              return (
                <div key={zone} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, textTransform: "uppercase", color: "rgba(248, 250, 252, 0.8)", letterSpacing: "1px" }}>{zone}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>
                      {status}
                    </span>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
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
"""

base = "/Users/shaswat/SENTINEL/sentinel/frontend/src"
with open(f"{base}/components/ml/CrowdDensityCard.tsx", "w") as f: f.write(CROWD_DENSITY_TSX)
with open(f"{base}/components/ml/HardwareStatusPanel.tsx", "w") as f: f.write(HARDWARE_TSX)
