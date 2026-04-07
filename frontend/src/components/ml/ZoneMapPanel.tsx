import React from "react";
import { HardwareCommands, ZoneStatus } from "@/types/ml";

type Props = {
  zoneStatus: ZoneStatus;
  hardwareCommands: HardwareCommands;
};

const zoneColor = (status: string) => {
  const value = String(status).toUpperCase();
  if (value === "CRITICAL") return { fill: "rgba(239,68,68,0.3)", stroke: "#ef4444" };
  if (value === "MODERATE") return { fill: "rgba(234,179,8,0.3)", stroke: "#eab308" };
  return { fill: "rgba(34,197,94,0.3)", stroke: "#22c55e" };
};

const ledColor = (led: string) => {
  const value = String(led).toLowerCase();
  if (value === "red") return "#ef4444";
  if (value === "yellow") return "#eab308";
  if (value === "green") return "#22c55e";
  return "#94a3b8";
};

export const ZoneMapPanel: React.FC<Props> = ({ zoneStatus, hardwareCommands }) => {
  const z1 = zoneColor(zoneStatus.z1);
  const z2 = zoneColor(zoneStatus.z2);
  const z3 = zoneColor(zoneStatus.z3);

  return (
    <div className="glass-card" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes sentinelDash {
          to { stroke-dashoffset: -22; }
        }
        @keyframes sentinelFlowA {
          0% { transform: translate(250px, 110px); opacity: 0.35; }
          50% { opacity: 1; }
          100% { transform: translate(170px, 228px); opacity: 0.35; }
        }
        @keyframes sentinelFlowB {
          0% { transform: translate(330px, 110px); opacity: 0.35; }
          50% { opacity: 1; }
          100% { transform: translate(410px, 228px); opacity: 0.35; }
        }
      `}</style>

      <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
        LIVE ZONE MAP
      </div>

      <svg viewBox="0 0 580 330" width="100%" height="320" role="img" aria-label="Live zone map">
        <line x1="290" y1="120" x2="200" y2="230" stroke="rgba(148,163,184,0.7)" strokeWidth="3" strokeDasharray="8 6" style={{ animation: "sentinelDash 1.2s linear infinite" }} />
        <line x1="290" y1="120" x2="400" y2="230" stroke="rgba(148,163,184,0.7)" strokeWidth="3" strokeDasharray="8 6" style={{ animation: "sentinelDash 1.2s linear infinite" }} />

        <g style={{ animation: "sentinelFlowA 1.8s linear infinite" }}>
          <circle cx="0" cy="0" r="6" fill="#38bdf8" />
        </g>
        <g style={{ animation: "sentinelFlowB 1.8s linear infinite" }}>
          <circle cx="0" cy="0" r="6" fill="#38bdf8" />
        </g>

        <rect x="205" y="30" width="170" height="95" rx="18" fill={z1.fill} stroke={z1.stroke} strokeWidth="2" />
        <text x="290" y="65" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="700">ZONE 1 📷 Camera</text>
        <text x="290" y="93" textAnchor="middle" fill={z1.stroke} fontSize="16" fontWeight="800">{zoneStatus.z1}</text>

        <rect x="70" y="210" width="210" height="95" rx="18" fill={z2.fill} stroke={z2.stroke} strokeWidth="2" />
        <text x="175" y="245" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="700">ZONE 2 🔴 LED+Buzzer</text>
        <text x="175" y="272" textAnchor="middle" fill={z2.stroke} fontSize="16" fontWeight="800">{zoneStatus.z2}</text>
        <circle cx="252" cy="226" r="7" fill={ledColor(hardwareCommands.z2_led)} />
        {hardwareCommands.z2_buzzer && (
          <text x="175" y="296" textAnchor="middle" fill="#fca5a5" fontSize="12" fontWeight="700">🔔 BUZZER ON</text>
        )}

        <rect x="300" y="210" width="210" height="95" rx="18" fill={z3.fill} stroke={z3.stroke} strokeWidth="2" />
        <text x="405" y="245" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="700">ZONE 3 🔴 LED+Buzzer</text>
        <text x="405" y="272" textAnchor="middle" fill={z3.stroke} fontSize="16" fontWeight="800">{zoneStatus.z3}</text>
        <circle cx="482" cy="226" r="7" fill={ledColor(hardwareCommands.z3_led)} />
        {hardwareCommands.z3_buzzer && (
          <text x="405" y="296" textAnchor="middle" fill="#fca5a5" fontSize="12" fontWeight="700">🔔 BUZZER ON</text>
        )}
      </svg>
    </div>
  );
};
