import React from "react";
import { HardwareStatusResponse } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

type Props = {
  hardware: HardwareStatusResponse | null;
  loading?: boolean;
};

const trendColorMap: Record<string, string> = {
  INCREASING: "var(--color-critical)",
  DECREASING: "var(--color-safe)",
  STABLE: "var(--color-info)",
  UNKNOWN: "rgba(248, 250, 252, 0.5)",
};

const predictionColorMap: Record<string, string> = {
  LOW_TREND: "var(--color-safe)",
  MODERATE_TREND: "var(--color-warning)",
  HIGH_RISK: "var(--color-critical)",
  NO_DATA: "rgba(248, 250, 252, 0.5)",
};

export const MLInsightsPanel: React.FC<Props> = ({ hardware, loading }) => {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 20, height: "100%" }}>
        <Skeleton height="100%" />
      </div>
    );
  }

  if (!hardware || !hardware.trend_prediction) {
    return (
      <div className="glass-card" style={{ padding: 20, height: "100%", color: "#f8fafc" }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
          PREDICTIVE INSIGHTS
        </div>
        No predictive data available.
      </div>
    );
  }

  const trendObj = hardware.trend_prediction;
  const trend = trendObj.trend;
  const pred = trendObj.prediction;
  const confidence = trendObj.confidence;
  const density = Math.round(Math.max(0, Math.min(100, Number(trendObj.predicted_density) || 0)));

  const isCritical = pred === "HIGH_RISK";
  const isModerate = pred === "MODERATE_TREND";
  const color = isCritical ? "var(--color-critical)" : isModerate ? "var(--color-warning)" : "var(--color-safe)";
  const trendColor = trendColorMap[trend] ?? "rgba(248, 250, 252, 0.5)";

  const getInsightText = () => {
    if (isCritical) {
      return `Severe risk detected. Rapid density surge towards ${density}%. Avoid bottlenecks by diverting traffic immediately.`;
    }
    if (isModerate) {
      if (trend === "INCREASING") {
        return `Traffic rising toward ${density}%. Prepare to open auxiliary routes if density persists.`;
      } else {
        return `Moderate activity. Density stabilizing near ${density}%. Continue monitoring remotely.`;
      }
    }
    return `System reflects nominal thresholds at ${density}%. Operations are optimal. No anomalies detected.`;
  };

  const getActionText = () => {
    if (isCritical) return "EXECUTE CROWD DIVERSION";
    if (isModerate) return "PREPARE AUXILIARY ROUTES";
    return "MAINTAIN CURRENT OPERATIONS";
  };

  return (
    <div className="glass-card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px" }}>
          PREDICTIVE INSIGHTS & TRENDS
        </div>
        {typeof confidence === "number" && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "1px" }}>Confidence</div>
            <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 16 }}>{(confidence * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, opacity: 0.1, fontSize: 60 }}>📈</div>
          <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Trend</div>
          <div style={{ color: trendColor, fontWeight: 800, fontSize: 24, textTransform: "uppercase" }}>
            {trend}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", textAlign: "right", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: -5, top: -5, opacity: 0.1, fontSize: 60 }}>🎯</div>
          <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Predicted Density</div>
          <div style={{ color: predictionColorMap[pred] ?? "rgba(248, 250, 252, 0.5)", fontWeight: 800, fontSize: 24 }}>
            {density.toFixed(0)}%
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: 12, border: `1px solid color-mix(in srgb, ${color} 30%, rgba(255,255,255,0.05))` }}>
          <div style={{ padding: 10, background: `color-mix(in srgb, ${color} 15%, transparent)`, borderRadius: "50%" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.5px", color: color }}>
              {getActionText()}
            </span>
            <span style={{ color: "rgba(248, 250, 252, 0.8)", fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
              {getInsightText()}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.03)" }}>
           <div style={{ color: "rgba(248, 250, 252, 0.6)", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>FORECAST HORIZON</div>
           <div style={{ color: predictionColorMap[pred] ?? "rgba(248, 250, 252, 0.5)", fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>{pred.replace("_", " ")}</div>
        </div>
      </div>
    </div>
  );
};
