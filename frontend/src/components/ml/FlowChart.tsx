import React, { useMemo } from "react";
import { FlowPoint } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

type Props = {
  data: FlowPoint[];
  loading?: boolean;
};

const chartHeight = 160;

export const FlowChart: React.FC<Props> = ({ data, loading }) => {
  const points = data ?? [];

  const domain = useMemo(() => {
    if (!points.length) return { min: 0, max: 1 };
    const values = points.flatMap((p) => [p.inflow, p.outflow, p.net]);
    const min = Math.min(0, ...values);
    const max = Math.max(1, ...values);
    return { min, max: max === min ? max + 1 : max };
  }, [points]);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <Skeleton height={chartHeight} />
      </div>
    );
  }

  if (!points.length) {
    return (
      <div className="glass-card" style={{ padding: 16, color: "#f8fafc" }}>Flow data unavailable</div>
    );
  }

  const width = Math.max(240, points.length * 40);

  const scaleX = (index: number) => (index / Math.max(points.length - 1, 1)) * width;
  const scaleY = (value: number) => {
    const range = domain.max - domain.min || 1;
    return chartHeight - ((value - domain.min) / range) * chartHeight;
  };

  const linePath = (selector: (p: FlowPoint) => number) =>
    points
      .map((p, idx) => `${idx === 0 ? "M" : "L"}${scaleX(idx)},${scaleY(selector(p))}`)
      .join(" ");

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px" }}>CROWD FLOW</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", color: "rgba(248, 250, 252, 0.7)", fontSize: 14 }}>
          <Legend color="#38bdf8" label="Inflow" />
          <Legend color="#f97316" label="Outflow" />
          <Legend color="#a855f7" label="Net" />
        </div>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <svg width={width} height={chartHeight} style={{ display: "block" }}>
          <Axes />
          <path d={linePath((p) => p.inflow)} fill="none" stroke="#38bdf8" strokeWidth={2} strokeLinejoin="round" />
          <path d={linePath((p) => p.outflow)} fill="none" stroke="#f97316" strokeWidth={2} strokeLinejoin="round" />
          <path d={linePath((p) => p.net)} fill="none" stroke="#a855f7" strokeWidth={2} strokeLinejoin="round" strokeDasharray="6 4" />
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

const Axes: React.FC = () => (
  <g>
    <line x1={0} y1={chartHeight - 1} x2="100%" y2={chartHeight - 1} stroke="#1f2937" strokeWidth={1} />
  </g>
);
