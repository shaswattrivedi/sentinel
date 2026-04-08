import React from "react";
import { HardwareStatusResponse } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

type Props = {
  hardware: HardwareStatusResponse | null;
  loading?: boolean;
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

  const trend = hardware.trend_prediction.trend;
  const pred = hardware.trend_prediction.prediction;
  const confidence = hardware.trend_prediction.confidence;
  const density = Math.round(Math.max(0, Math.min(100, Number(hardware.trend_prediction.predicted_density) || 0)));

  const isCritical = pred === "HIGH_RISK";
  const isModerate = pred === "MODERATE_TREND";
  const color = isCritical ? "var(--color-critical)" : isModerate ? "var(--color-warning)" : "var(--color-safe)";

  const getInsightText = () => {
    if (isCritical) {
      return `The model indicates a severe risk scenario. Crowd density is rapidly surging toward ${density}% capacity. Critical bottlenecks are likely to form. Immediate pre-emptive redistribution of pedestrian traffic is heavily recommended.`;
    }
    if (isModerate) {
      if (trend === "INCREASING") {
        return `Traffic flow is steadily rising. Overall density is anticipated to hit ${density}%. Continue monitoring bottlenecks remotely. Open auxiliary thoroughfares if accumulation accelerates.`;
      } else {
        return `Moderate flow detected. Density is stabilizing near ${density}%. Conditions are manageable but require watchful supervision.`;
      }
    }
    return `System reflects nominal thresholds with density estimated around ${density}%. Operations are optimal. No anomalous crowd behaviors or bottlenecks are anticipated at this time.`;
  };

  const getActionText = () => {
    if (isCritical) return "EXECUTE CROWD DIVERSION";
    if (isModerate) return "PREPARE AUXILIARY ROUTES";
    return "MAINTAIN CURRENT OPERATIONS";
  };

  return (
    <div className="glass-card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px" }}>
          PREDICTIVE INSIGHTS
        </div>
        {typeof confidence === "number" && (
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>Confidence</div>
            <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 18 }}>{(confidence * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2, color }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.5px", color: "#f8fafc" }}>
              {getActionText()}
            </span>
            <span style={{ color: "rgba(248, 250, 252, 0.8)", fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>
              {getInsightText()}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <div style={{ color: "rgba(248, 250, 252, 0.6)", fontSize: 13, fontWeight: 600, letterSpacing: "0.5px" }}>PROJECTED PEAK DENSITY</div>
           <div style={{ color: color, fontSize: 20, fontWeight: 800, textShadow: `0 0 10px ${color}60` }}>{density}%</div>
        </div>
      </div>
    </div>
  );
};
