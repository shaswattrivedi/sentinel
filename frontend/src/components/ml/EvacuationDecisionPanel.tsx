import React from "react";
import { DecisionResponse } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

type Props = {
  decision: DecisionResponse | null;
  loading?: boolean;
};

const stateColor: Record<DecisionResponse["state"], string> = {
  NORMAL: "#22c55e",
  WARNING: "#f59e0b",
  EVACUATE: "#ef4444"
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
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "rgba(248, 250, 252, 0.75)", fontSize: 12 }}>Evacuation Decision</div>
          <div style={{ color, fontWeight: 700, fontSize: 20 }}>{decision.state}</div>
          {decision.recommendedDirection && (
            <div style={{ color: "rgba(248, 250, 252, 0.75)", marginTop: 6 }}>
              Direction: {decision.recommendedDirection}
            </div>
          )}
          {decision.rationale && (
            <div style={{ color: "rgba(248, 250, 252, 0.65)", marginTop: 6, fontSize: 13 }}>
              {decision.rationale}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {typeof decision.confidence === "number" && (
            <div style={{ color: "rgba(248, 250, 252, 0.75)", fontSize: 12 }}>
              Confidence
            </div>
          )}
          {typeof decision.confidence === "number" && (
            <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 18 }}>
              {(decision.confidence * 100).toFixed(0)}%
            </div>
          )}
          <div style={{ color: "rgba(248, 250, 252, 0.6)", fontSize: 12, marginTop: 6 }}>
            Updated {new Date(decision.updatedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};
