import React, { useMemo } from "react";
import { RiskLevel, TimelinePoint } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const levelColor: Record<RiskLevel, string> = {
  LOW: "var(--color-safe)",
  MEDIUM: "var(--color-warning)",
  HIGH: "var(--color-critical)"
};

type Props = {
  data: TimelinePoint[];
  loading?: boolean;
};

const HEIGHT = 320;

export const RiskTimelineChart: React.FC<Props> = ({ data, loading }) => {
  const points = data ?? [];
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = React.useState(200);

  React.useEffect(() => {
    if (!containerRef.current) return;
    setChartHeight(Math.max(100, containerRef.current.offsetHeight - 140));
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setChartHeight(Math.max(100, entry.contentRect.height - 140)); // Account for header and footer spacing
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const domain = useMemo(() => {
    if (!points.length) return { min: 0, max: 100 };
    const scores = points.map((p) => p.riskScore);
    const min = Math.min(...scores, 0);
    const max = Math.max(...scores, 100);
    return { min, max: max === min ? max + 1 : max };
  }, [points]);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
        <Skeleton height="100%" />
      </div>
    );
  }

  if (!points.length) {
    return (
      <div className="glass-card" style={{ padding: 24, color: "#f8fafc", height: "100%" }}>Timeline data unavailable</div>
    );
  }

  const HEIGHT = chartHeight;
  const width = Math.max(800, points.length * 40);
  const scaleX = (idx: number) => (idx / Math.max(points.length - 1, 1)) * width;
  const scaleY = (value: number) => {
    const range = domain.max - domain.min || 1;
    return HEIGHT - ((value - domain.min) / range) * HEIGHT;
  };

  const path = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"}${scaleX(idx)},${scaleY(p.riskScore)}`)
    .join(" ");

  const polylineStr = points.map((p, idx) => `${scaleX(idx)},${scaleY(p.riskScore)}`).join(" ") + ` ${scaleX(points.length - 1)},${HEIGHT} 0,${HEIGHT}`;

  return (
    <div ref={containerRef} className="glass-card" style={{ padding: 20, height: "100%", width: "100%", display: "flex", flexDirection: "column", minHeight: 300 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px" }}>RISK TIMELINE</div>
        <div style={{ display: "flex", gap: 16, fontSize: 14, color: "rgba(248, 250, 252, 0.7)" }}>
          <Legend color={levelColor.LOW} label="Low" />
          <Legend color={levelColor.MEDIUM} label="Medium" />
          <Legend color={levelColor.HIGH} label="High" />
        </div>
      </div>
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent", position: "relative" }}>
        <svg width={width} height={HEIGHT} style={{ display: "block", minWidth: "100%" }}>
          <defs>
            <filter id="glow-low" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-medium" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-high" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <polyline
            points={polylineStr}
            fill="color-mix(in srgb, var(--color-info) 8%, transparent)"
            stroke="none"
            style={{ transition: "points 0.5s ease-in-out" }}
          />
          <path d={path} fill="none" stroke="var(--color-info)" strokeWidth={2} strokeLinejoin="round" style={{ transition: "d 0.5s ease-in-out" }} />
          {points.map((p, idx) => {
            const color = levelColor[p.densityLevel];
            const filterId = p.densityLevel === "LOW" ? "glow-low" : p.densityLevel === "MEDIUM" ? "glow-medium" : "glow-high";
            return (
              <circle
                key={idx}
                cx={scaleX(idx)}
                cy={scaleY(p.riskScore)}
                r={6}
                fill={color}
                filter={`url(#${filterId})`}
                style={{ transition: "cx 0.5s ease-in-out, cy 0.5s ease-in-out, fill 0.3s ease-in-out" }}
              >
                <title>
                  {new Date(p.timestamp).toLocaleString()}\nRisk: {p.riskScore}\nDensity: {p.densityLevel}
                </title>
              </circle>
            );
          })}
        </svg>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: "rgba(56, 189, 248, 0.05)", borderRadius: 10, border: "1px solid rgba(56, 189, 248, 0.15)", flexShrink: 0 }}>
        <div style={{ color: "rgba(56, 189, 248, 0.8)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
          INTERPRETATION
        </div>
        <div style={{ color: "rgba(248, 250, 252, 0.85)", fontSize: 13, lineHeight: 1.4 }}>
          Blue line measures the real-time Fusion Risk Score (0-100). Dots highlight density states (Safe, Moderate, Critical). High crests matching red dots require rapid diversion.
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
