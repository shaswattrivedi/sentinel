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

export const MLTrendPanel: React.FC<Props> = ({ hardware, loading }) => {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 24 }}>
        <Skeleton height={120} />
      </div>
    );
  }

  const trend = hardware?.trend_prediction ?? {
    trend: "UNKNOWN",
    prediction: "NO_DATA",
    predicted_density: 0,
    confidence: 0,
  };
  const predictedDensity = Math.max(0, Math.min(100, Number(trend.predicted_density) || 0));

  const color = trendColorMap[trend.trend] ?? "rgba(248, 250, 252, 0.5)";

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 16 }}>ML TREND PREDICTION</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 14, marginBottom: 4 }}>Trend</div>
          <div style={{ color, fontWeight: 700, fontSize: 28, textTransform: "uppercase" }}>
            {trend.trend}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 14, marginBottom: 4 }}>Predicted Density</div>
          <div style={{ color: predictionColorMap[trend.prediction] ?? "rgba(248, 250, 252, 0.5)", fontWeight: 700, fontSize: 28 }}>
            {predictedDensity.toFixed(0)}%
          </div>
        </div>
      </div>
      {typeof trend.confidence === "number" && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 14 }}>Confidence</div>
          <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: 16 }}>{(trend.confidence * 100).toFixed(0)}%</div>
        </div>
      )}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ 
          color: predictionColorMap[trend.prediction] ?? "rgba(248, 250, 252, 0.5)", 
          fontWeight: 800, 
          fontSize: 16,
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}>
          {trend.prediction.replace("_", " ")}
        </div>
      </div>
    </div>
  );
};
