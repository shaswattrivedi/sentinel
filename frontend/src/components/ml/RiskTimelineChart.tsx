import React, { useMemo } from "react";
import { RiskLevel, TimelinePoint } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const levelColor: Record<RiskLevel, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444"
};

type Props = {
  data: TimelinePoint[];
  loading?: boolean;
};

const HEIGHT = 180;

export const RiskTimelineChart: React.FC<Props> = ({ data, loading }) => {
  const points = data ?? [];

  const domain = useMemo(() => {
    if (!points.length) return { min: 0, max: 100 };
    const scores = points.map((p) => p.riskScore);
    const min = Math.min(...scores, 0);
    const max = Math.max(...scores, 100);
    return { min, max: max === min ? max + 1 : max };
  }, [points]);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <Skeleton height={HEIGHT} />
      </div>
    );
  }

  if (!points.length) {
    return (
      <div className="glass-card" style={{ padding: 16, color: "#f8fafc" }}>Timeline data unavailable</div>
    );
  }

  const width = Math.max(260, points.length * 32);
  const scaleX = (idx: number) => (idx / Math.max(points.length - 1, 1)) * width;
  const scaleY = (value: number) => {
    const range = domain.max - domain.min || 1;
    return HEIGHT - ((value - domain.min) / range) * HEIGHT;
  };

  const path = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"}${scaleX(idx)},${scaleY(p.riskScore)}`)
    .join(" ");

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.75)", fontSize: 12 }}>Risk Timeline</div>
        <div style={{ display: "flex", gap: 10, fontSize: 12, color: "rgba(248, 250, 252, 0.7)" }}>
          <Legend color={levelColor.LOW} label="Low" />
          <Legend color={levelColor.MEDIUM} label="Medium" />
          <Legend color={levelColor.HIGH} label="High" />
        </div>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <svg width={width} height={HEIGHT} style={{ display: "block" }}>
          <polyline
            points={points.map((p, idx) => `${scaleX(idx)},${scaleY(p.riskScore)}`).join(" ")}
            fill="#2563eb15"
            stroke="none"
          />
          <path d={path} fill="none" stroke="#60a5fa" strokeWidth={2} strokeLinejoin="round" />
          {points.map((p, idx) => (
            <circle
              key={p.timestamp}
              cx={scaleX(idx)}
              cy={scaleY(p.riskScore)}
              r={4}
              fill={levelColor[p.densityLevel]}
            >
              <title>
                {new Date(p.timestamp).toLocaleString()}\nRisk: {p.riskScore}\nDensity: {p.densityLevel}
              </title>
            </circle>
          ))}
        </svg>
      </div>
    </div>
  );
};

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
    {label}
  </span>
);
