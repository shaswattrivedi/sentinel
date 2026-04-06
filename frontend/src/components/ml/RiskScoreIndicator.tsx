import React from "react";
import { RiskLevel } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const levelColor: Record<RiskLevel, string> = {
  LOW: "var(--color-safe)",
  MEDIUM: "var(--color-warning)",
  HIGH: "var(--color-critical)"
};

const levelLabel: Record<RiskLevel, string> = {
  LOW: "Safe",
  MEDIUM: "Warning",
  HIGH: "Danger"
};

type Props = {
  score: number | null;
  level: RiskLevel | null;
  loading?: boolean;
};

export const RiskScoreIndicator: React.FC<Props> = ({ score, level, loading }) => {
  const [animatedScore, setAnimatedScore] = React.useState(0);

  React.useEffect(() => {
    if (score !== null) {
      // Small timeout to allow initial render at 0 before animating
      const t = setTimeout(() => setAnimatedScore(score), 100);
      return () => clearTimeout(t);
    }
  }, [score]);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <Skeleton height={140} />
      </div>
    );
  }

  if (score == null || !level) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ color: "#f8fafc" }}>Risk data unavailable</div>
      </div>
    );
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(animatedScore, 100));
  const offset = circumference - (progress / 100) * circumference;
  const color = levelColor[level];

  return (
    <div className="glass-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px" }}>CURRENT RISK</div>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <svg width={140} height={140} style={{ flexShrink: 0 }}>
          <circle
            cx={70}
            cy={70}
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={12}
            fill="none"
          />
        <circle
          cx={70}
          cy={70}
          r={radius}
          stroke={color}
          strokeWidth={12}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            transform: "rotate(-90deg)",
            transformOrigin: "70px 70px",
            filter: `drop-shadow(0 0 8px ${color}80)`
          }}
        />
        <text x="70" y="68" textAnchor="middle" fill="#f8fafc" fontSize="32" fontWeight="700">
          {Math.round(animatedScore)}
        </text>
        <text x="70" y="92" textAnchor="middle" fill="rgba(248, 250, 252, 0.5)" fontSize="13" fontWeight="600">
          STATUS
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", textAlign: "right" }}>
        <div style={{ 
          color, 
          fontSize: 24, 
          fontWeight: 700, 
          textTransform: "uppercase", 
          textShadow: `0 0 10px ${color}60` 
        }}>
          {levelLabel[level]}
        </div>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 14, maxWidth: 140 }}>
          Updated in real-time
        </div>
      </div>
      </div>
    </div>
  );
};
