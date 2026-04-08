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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
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
          {(decision.recommendedDirection || decision.rationale) && (
            <div style={{ color: "#f8fafc", marginTop: 16, fontSize: 15, display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(255,255,255,0.06)", padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2, color: "#f8fafc" }}>
                 <line x1="5" y1="12" x2="19" y2="12"></line>
                 <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ color: "rgba(248, 250, 252, 0.9)", fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
                  <strong style={{ color: "#f8fafc", letterSpacing: "0.5px" }}>Insight: </strong>
                  {decision.recommendedDirection && decision.rationale
                    ? `Proceed ${decision.recommendedDirection}. ${decision.rationale}`
                    : decision.rationale || `Optimal routing via ${decision.recommendedDirection}.`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
