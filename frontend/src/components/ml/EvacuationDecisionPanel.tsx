import React from "react";
import { DecisionResponse } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

type Props = {
  decision: DecisionResponse | null;
  loading?: boolean;
};

const stateColor: Record<DecisionResponse["state"], string> = {
  NORMAL: "var(--color-safe)",
  WARNING: "var(--color-warning)",
  EVACUATE: "var(--color-critical)"
};

export const EvacuationDecisionPanel: React.FC<Props> = ({ decision, loading }) => {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <Skeleton height={100} />
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="glass-card" style={{ padding: 16, color: "#f8fafc" }}>Decision data unavailable</div>
    );
  }

  const color = stateColor[decision.state];

  return (
    <div className="glass-card" style={{ 
      padding: 16, 
      border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
      boxShadow: `0 8px 32px color-mix(in srgb, ${color} 15%, transparent)`,
      background: `color-mix(in srgb, ${color} 5%, var(--color-card))`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px" }}>EVACUATION DECISION</div>
        {typeof decision.confidence === "number" && (
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 12, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>Confidence</div>
            <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 22 }}>{(decision.confidence * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ 
            color, 
            fontWeight: 800, 
            fontSize: 36, 
            textTransform: "uppercase",
            textShadow: `0 0 15px ${color}80`,
            lineHeight: 1
          }}>
            {decision.state}
          </div>
          {decision.recommendedDirection && (
            <div style={{ color: "#f8fafc", marginTop: 16, fontSize: 16, fontWeight: 500, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color, fontSize: 20, lineHeight: 1 }}>↪</span> 
              <span>Direction: <span style={{ color: "var(--color-info)", fontWeight: 600 }}>{decision.recommendedDirection}</span></span>
            </div>
          )}
          {decision.rationale && (
            <div style={{ color: "rgba(248, 250, 252, 0.65)", marginTop: 8, fontSize: 15, lineHeight: 1.5, maxWidth: "90%" }}>
              {decision.rationale}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", marginTop: "auto" }}>
          <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 12 }}>
            Updated {new Date(decision.updatedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};
