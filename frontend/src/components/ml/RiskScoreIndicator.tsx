import React from "react";
import { RiskLevel } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

const levelColor: Record<RiskLevel, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444"
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

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(score, 100));
  const offset = circumference - (progress / 100) * circumference;
  const color = levelColor[level];

  return (
    <div className="glass-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={140} height={140} style={{ flexShrink: 0 }}>
        <circle
          cx={70}
          cy={70}
          r={radius}
          stroke="#1f2937"
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
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="70" y="66" textAnchor="middle" fill="#f8fafc" fontSize="28" fontWeight="700">
          {score}
        </text>
        <text x="70" y="88" textAnchor="middle" fill="rgba(248, 250, 252, 0.7)" fontSize="12">
          / 100
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ color: "rgba(248, 250, 252, 0.75)", fontSize: 12 }}>Current Risk</div>
        <div style={{ color, fontSize: 18, fontWeight: 700 }}>{levelLabel[level]}</div>
        <div style={{ color: "rgba(248, 250, 252, 0.6)", fontSize: 13 }}>
          Updated in near real-time from ML intelligence.
        </div>
      </div>
    </div>
  );
};
