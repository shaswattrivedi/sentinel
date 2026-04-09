import React, { useMemo } from "react";
import { FlowPoint } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

type Props = {
  data: FlowPoint[];
  loading?: boolean;
};

export const FlowChart: React.FC<Props> = ({ data, loading }) => {
  const points = data ?? [];
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = React.useState(200);

  React.useEffect(() => {
    if (!containerRef.current) return;
    setChartHeight(Math.max(100, containerRef.current.offsetHeight - 140));
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setChartHeight(Math.max(100, entry.contentRect.height - 140));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const domain = useMemo(() => {
    if (!points.length) return { min: 0, max: 1 };
    const values = points.flatMap((p) => [p.inflow, p.outflow, p.net]);
    const min = Math.min(0, ...values);
    const max = Math.max(1, ...values);
    return { min, max: max === min ? max + 1 : max };
  }, [points]);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 24, width: "100%", height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Skeleton height="100%" />
      </div>
    );
  }

  if (!points.length) {
    return (
      <div className="glass-card" style={{ padding: 24, color: "#f8fafc", width: "100%", minWidth: 0, height: "100%" }}>Flow data unavailable</div>
    );
  }

  const width = Math.max(800, points.length * 40);

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
    <div ref={containerRef} className="glass-card" style={{ padding: 20, width: "100%", height: "100%", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 300 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px" }}>CROWD FLOW</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", color: "rgba(248, 250, 252, 0.7)", fontSize: 14 }}>
          <Legend color="#38bdf8" label="Inflow" />
          <Legend color="#f97316" label="Outflow" />
          <Legend color="#a855f7" label="Net" />
        </div>
      </div>
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent", position: "relative" }}>
        <svg width={width} height={chartHeight} style={{ display: "block", minWidth: "100%" }}>
          <Axes chartHeight={chartHeight} />
          <path d={linePath((p) => p.inflow)} fill="none" stroke="#38bdf8" strokeWidth={3} strokeLinejoin="round" style={{ transition: "d 0.5s ease-in-out" }} />
          <path d={linePath((p) => p.outflow)} fill="none" stroke="#f97316" strokeWidth={3} strokeLinejoin="round" style={{ transition: "d 0.5s ease-in-out" }} />
          <path d={linePath((p) => p.net)} fill="none" stroke="#a855f7" strokeWidth={2} strokeLinejoin="round" strokeDasharray="6 4" style={{ transition: "d 0.5s ease-in-out" }} />
        </svg>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "rgba(56, 189, 248, 0.05)", borderRadius: 10, border: "1px solid rgba(56, 189, 248, 0.15)", flexShrink: 0 }}>
        <div style={{ color: "rgba(56, 189, 248, 0.8)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
          INTERPRETATION
        </div>
        <div style={{ color: "rgba(248, 250, 252, 0.85)", fontSize: 13, lineHeight: 1.4 }}>
          Blue represents arriving crowds, Orange indicates departing individuals. A rising Purple (Net) line means rapid crowding accumulation—watch out for congestion spikes.
        </div>
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

const Axes: React.FC<{ chartHeight: number }> = ({ chartHeight }) => (
  <g>
    <line x1={0} y1={chartHeight - 1} x2="100%" y2={chartHeight - 1} stroke="#1f2937" strokeWidth={1} />
  </g>
);
