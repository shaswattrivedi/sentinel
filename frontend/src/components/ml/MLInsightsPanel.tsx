import React from "react";
import { AlertItem, HardwareStatusResponse, TimelinePoint } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

type Props = {
  hardware: HardwareStatusResponse | null;
  timeline?: TimelinePoint[];
  alerts?: AlertItem[];
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

const RISK_FLOW_COLOR: Record<"RISING" | "FALLING" | "STABLE" | "NO_DATA", string> = {
  RISING: "var(--color-critical)",
  FALLING: "var(--color-safe)",
  STABLE: "var(--color-info)",
  NO_DATA: "rgba(248, 250, 252, 0.55)",
};

type ShortWindowTrend = {
  minutes: number;
  riskDelta: number | null;
  alertCount: number | null;
  flow: "RISING" | "FALLING" | "STABLE" | "NO_DATA";
};

function buildShortWindowTrends(
  timeline: TimelinePoint[] | undefined,
  alerts: AlertItem[] | undefined,
  fallbackTimestamp?: string
): ShortWindowTrend[] {
  const windows = [10, 20, 30];
  const parsed = (timeline ?? [])
    .map((point) => ({
      riskScore: point.riskScore,
      ms: Date.parse(point.timestamp),
    }))
    .filter((point) => Number.isFinite(point.ms))
    .sort((a, b) => a.ms - b.ms);
  const parsedAlerts = (alerts ?? [])
    .filter((entry) => String(entry.severity).toLowerCase() === "critical")
    .map((entry) => Date.parse(entry.timestamp))
    .filter((ms) => Number.isFinite(ms))
    .sort((a, b) => a - b);

  const fallbackMs = fallbackTimestamp ? Date.parse(fallbackTimestamp) : NaN;
  const latestMs = parsed.length ? parsed[parsed.length - 1].ms : Number.isFinite(fallbackMs) ? fallbackMs : NaN;

  if (!Number.isFinite(latestMs) || !parsed.length) {
    return windows.map((minutes) => ({ minutes, riskDelta: null, alertCount: null, flow: "NO_DATA" }));
  }

  const latestPoint = parsed[parsed.length - 1];

  return windows.map((minutes) => {
    const startMs = latestMs - minutes * 60 * 1000;
    const alertCount = parsedAlerts.filter((ms) => ms >= startMs && ms <= latestMs).length;
    const atOrBeforeWindowStart = parsed.filter((point) => point.ms <= startMs);
    const withinWindow = parsed.filter((point) => point.ms >= startMs && point.ms <= latestMs);
    const baseline = atOrBeforeWindowStart.length
      ? atOrBeforeWindowStart[atOrBeforeWindowStart.length - 1]
      : withinWindow.length
      ? withinWindow[0]
      : null;

    if (!baseline) {
      return { minutes, riskDelta: null, alertCount, flow: "NO_DATA" as const };
    }

    const riskDelta = latestPoint.riskScore - baseline.riskScore;
    const flow: ShortWindowTrend["flow"] =
      riskDelta >= 6 ? "RISING" : riskDelta <= -6 ? "FALLING" : "STABLE";

    return {
      minutes,
      riskDelta,
      alertCount,
      flow,
    };
  });
}

function formatRiskDelta(delta: number | null): string {
  if (delta === null || Number.isNaN(delta)) return "No Data";
  if (delta > 0) return `+${delta.toFixed(1)} pts`;
  if (delta < 0) return `${delta.toFixed(1)} pts`;
  return "0.0 pts";
}

function formatAlertCount(count: number | null): string {
  if (count === null || Number.isNaN(count)) return "No Data";
  return String(count);
}

function getAlertColor(count: number | null): string {
  if (count === null || Number.isNaN(count)) return "rgba(248, 250, 252, 0.82)";
  if (count >= 3) return "var(--color-critical)";
  if (count >= 1) return "var(--color-warning)";
  return "var(--color-safe)";
}

const ShortWindowTrendGrid: React.FC<{ trends: ShortWindowTrend[] }> = ({ trends }) => (
  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0 }}>
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9999, border: "1px solid rgba(177, 158, 239, 0.18)", background: "rgba(11, 10, 21, 0.7)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)", width: "fit-content", color: "#f8fafc", fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-info)", boxShadow: "0 0 8px var(--color-info)" }} />
      SHORT WINDOW TRENDS
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, flex: 1, minHeight: 0, alignItems: "stretch" }}>
      {trends.map((item) => (
        <div
          key={item.minutes}
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 10,
            height: "100%",
            minHeight: 132,
          }}
        >
          <div style={{ color: "rgba(248, 250, 252, 0.78)", fontSize: 15, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.55px", lineHeight: 1.25 }}>
            Last {item.minutes} Min
          </div>
          <div>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Risk Increase
            </div>
            <div style={{ color: item.riskDelta !== null && item.riskDelta > 0 ? "var(--color-critical)" : item.riskDelta !== null && item.riskDelta < 0 ? "var(--color-safe)" : "rgba(248, 250, 252, 0.82)", fontWeight: 700, fontSize: 15 }}>
              {formatRiskDelta(item.riskDelta)}
            </div>
          </div>
          <div>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Critical Alerts
            </div>
            <div style={{ color: getAlertColor(item.alertCount), fontWeight: 700, fontSize: 14, letterSpacing: "0.3px" }}>
              {formatAlertCount(item.alertCount)}
            </div>
          </div>
          <div>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Overall Risk Flow
            </div>
            <div style={{ color: RISK_FLOW_COLOR[item.flow], fontWeight: 700, fontSize: 13, letterSpacing: "0.4px" }}>
              {item.flow}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const MLInsightsPanel: React.FC<Props> = ({ hardware, timeline, alerts, loading }) => {
  const shortWindowTrends = React.useMemo(
    () => buildShortWindowTrends(timeline, alerts, hardware?.timestamp),
    [timeline, alerts, hardware?.timestamp]
  );

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 20, height: "100%" }}>
        <Skeleton height="100%" />
      </div>
    );
  }

  if (!hardware || !hardware.trend_prediction) {
    return (
      <div className="glass-card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9999, border: "1px solid rgba(177, 158, 239, 0.18)", background: "rgba(11, 10, 21, 0.7)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)", width: "fit-content", color: "#f8fafc", fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-info)", boxShadow: "0 0 8px var(--color-info)" }} />
            PREDICTIVE INSIGHTS & TRENDS
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "1px" }}>Confidence</div>
            <div style={{ color: "rgba(248, 250, 252, 0.55)", fontWeight: 700, fontSize: 16 }}>--</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Trend</div>
            <div style={{ color: "rgba(248, 250, 252, 0.55)", fontWeight: 800, fontSize: 24, textTransform: "uppercase" }}>
              No Data
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", textAlign: "right", position: "relative", overflow: "hidden" }}>
            <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Predicted Density</div>
            <div style={{ color: "rgba(248, 250, 252, 0.55)", fontWeight: 800, fontSize: 24 }}>
              --
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ padding: 10, background: "rgba(255,255,255,0.06)", borderRadius: "50%" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(248, 250, 252, 0.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(248, 250, 252, 0.7)" }}>
                Awaiting Predictive Stream
              </span>
              <span style={{ color: "rgba(248, 250, 252, 0.8)", fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
                Telemetry has not produced enough data yet. This card keeps the same layout and will populate automatically as readings arrive.
              </span>
            </div>
          </div>
        </div>

        <ShortWindowTrendGrid trends={shortWindowTrends} />

        <div style={{ marginTop: 16 }}>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ color: "rgba(248, 250, 252, 0.6)", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>FORECAST HORIZON</div>
            <div style={{ color: "rgba(248, 250, 252, 0.55)", fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>No Data</div>
          </div>
        </div>
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
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9999, border: "1px solid rgba(177, 158, 239, 0.18)", background: "rgba(11, 10, 21, 0.7)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)", width: "fit-content", color: "#f8fafc", fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-info)", boxShadow: "0 0 8px var(--color-info)" }} />
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
          <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Trend</div>
          <div style={{ color: trendColor, fontWeight: 800, fontSize: 24, textTransform: "uppercase" }}>
            {trend}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", textAlign: "right", position: "relative", overflow: "hidden" }}>
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

      <ShortWindowTrendGrid trends={shortWindowTrends} />

      <div style={{ marginTop: 16 }}>
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.03)" }}>
           <div style={{ color: "rgba(248, 250, 252, 0.6)", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>FORECAST HORIZON</div>
           <div style={{ color: predictionColorMap[pred] ?? "rgba(248, 250, 252, 0.5)", fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>{pred.replace("_", " ")}</div>
        </div>
      </div>
    </div>
  );
};
