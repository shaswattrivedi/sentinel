import React from "react";
import { ZoneData, ZoneStatusLevel } from "@/types/ml";

interface ZoneMapPanelProps {
  zoneStatus: { "zone-1": ZoneStatusLevel; "zone-2": ZoneStatusLevel };
  zoneData: {
    "zone-1": ZoneData;
    "zone-2": ZoneData;
  };
}

type StatusVisual = {
  fill: string;
  border: string;
  text: string;
  badge: string;
};

const statusVisuals: Record<ZoneStatusLevel, StatusVisual> = {
  SAFE: {
    fill: "rgba(34, 197, 94, 0.2)",
    border: "rgba(34, 197, 94, 1)",
    text: "#86efac",
    badge: "SAFE",
  },
  MODERATE: {
    fill: "rgba(234, 179, 8, 0.2)",
    border: "rgba(234, 179, 8, 1)",
    text: "#fde047",
    badge: "MODERATE",
  },
  CRITICAL: {
    fill: "rgba(239, 68, 68, 0.2)",
    border: "rgba(239, 68, 68, 1)",
    text: "#fca5a5",
    badge: "CRITICAL",
  },
};

const ZoneCard: React.FC<{
  zoneKey: "zone-1" | "zone-2";
  title: string;
  status: ZoneStatusLevel;
  data: ZoneData;
}> = ({ zoneKey, title, status, data }) => {
  const visual = statusVisuals[status];
  const sensorScore = Math.max(0, Math.min(100, Number(data.validation_score) || 0));

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${visual.border}`,
        background: visual.fill,
        padding: 16,
        minHeight: 188,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: `0 12px 28px color-mix(in srgb, ${visual.border} 18%, transparent)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", letterSpacing: 0.4 }}>{title}</div>
        <div
          style={{
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 800,
            color: visual.text,
            border: `1px solid ${visual.border}`,
            background: "rgba(0,0,0,0.25)",
            letterSpacing: 0.8,
          }}
        >
          {visual.badge}
        </div>
      </div>

      <div style={{ color: "rgba(248, 250, 252, 0.65)", fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase" }}>
        CAM + PIR + IR
      </div>

      <div style={{ color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>People: {data.cam_people_count}</div>
      <div style={{ color: "rgba(248, 250, 252, 0.84)", fontSize: 14 }}>Val: {sensorScore.toFixed(0)}/100</div>

      <div style={{ marginTop: 2 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.7)", fontSize: 11, marginBottom: 6, letterSpacing: 0.3 }}>
          Sensor Validation
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(15, 23, 42, 0.65)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              width: `${sensorScore}%`,
              height: "100%",
              background: visual.border,
              boxShadow: `0 0 14px color-mix(in srgb, ${visual.border} 60%, transparent)`,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      <div style={{ color: visual.text, fontWeight: 800, fontSize: 14, marginTop: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: visual.border, boxShadow: `0 0 10px ${visual.border}` }} />
        {status}
      </div>
    </div>
  );
};

export const ZoneMapPanel: React.FC<ZoneMapPanelProps> = ({ zoneStatus, zoneData }) => {
  return (
    <div
      className="glass-card"
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <style>{`
        @keyframes crossZonePulse {
          0% { transform: translateX(0); opacity: 0.25; }
          35% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0.2; }
        }
      `}</style>

      <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
        LIVE ZONE MAP
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
        <ZoneCard zoneKey="zone-1" title="ZONE 1" status={zoneStatus["zone-1"]} data={zoneData["zone-1"]} />

        <div style={{ width: 120, textAlign: "center", alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <svg viewBox="0 0 120 32" width="100%" height="40" aria-label="Cross-zone monitor">
            <defs>
              <marker id="arrow-left" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148,163,184,0.85)" />
              </marker>
            </defs>
            <line
              x1="12"
              y1="16"
              x2="108"
              y2="16"
              stroke="rgba(148,163,184,0.8)"
              strokeWidth="2"
              markerStart="url(#arrow-left)"
              markerEnd="url(#arrow-left)"
            />
            <circle
              cx="12"
              cy="16"
              r="4"
              fill="#60a5fa"
              style={{ animation: "crossZonePulse 1.8s linear infinite" }}
            />
          </svg>
          <div style={{ color: "rgba(248,250,252,0.62)", fontSize: 11, letterSpacing: 0.7, textTransform: "uppercase" }}>
            Cross-Zone Monitor
          </div>
        </div>

        <ZoneCard zoneKey="zone-2" title="ZONE 2" status={zoneStatus["zone-2"]} data={zoneData["zone-2"]} />
      </div>
    </div>
  );
};
