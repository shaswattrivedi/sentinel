import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  AnalyticsFilter,
  AnalyticsPoint,
  AnalyticsSource,
  AnalyticsSnapshotsResponse,
  fetchAnalyticsInsight,
  fetchAnalyticsSnapshots
} from "@/api/analytics";
import { Skeleton } from "@/components/ml/Skeleton";

const FILTERS: AnalyticsFilter[] = ["daily", "weekly", "monthly"];
const SOURCES: Array<{ value: AnalyticsSource; label: string; dotColor: string }> = [
  { value: "all", label: "All Data", dotColor: "#f97316" },
  { value: "live", label: "Live", dotColor: "#22c55e" },
  { value: "seed", label: "Demo", dotColor: "#a855f7" }
];

const chartTickStyle = {
  fill: "#9ca3af",
  fontSize: 12,
  fontFamily: "var(--font-dashboard)"
};

const gridStroke = "rgba(255, 255, 255, 0.12)";

const today = () => new Date().toISOString().slice(0, 10);

const insightFallback = "Insight unavailable for selected period.";

const layoutStyle: React.CSSProperties = {
  minHeight: "100vh",
  maxWidth: 1600,
  margin: "0 auto",
  width: "100%",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
  fontFamily: "var(--font-dashboard)",
  color: "#f8fafc"
};

const cardPadding = 20;

const headerWrapperStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  width: "100%"
};

const pillBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 16px",
  borderRadius: 9999,
  border: "1px solid rgba(177, 158, 239, 0.18)",
  background: "rgba(11, 10, 21, 0.7)",
  backdropFilter: "blur(20px) saturate(1.4)",
  WebkitBackdropFilter: "blur(20px) saturate(1.4)",
  boxShadow:
    "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
  width: "fit-content",
  color: "#f8fafc",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.6,
  textTransform: "uppercase"
};

const tooltipStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background: "rgba(11, 10, 21, 0.95)",
  color: "#e2e8f0",
  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
  padding: 12,
  fontSize: 12,
  fontFamily: "var(--font-dashboard)"
};

function formatFilterLabel(filter: AnalyticsFilter): string {
  return `${filter.charAt(0).toUpperCase()}${filter.slice(1)}`;
}

function getAlertBarColor(value: number): string {
  if (value === 0) return "#1f2937";
  if (value <= 2) return "#eab308";
  return "#ef4444";
}

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(248, 250, 252, 0.7)", fontWeight: 500 }}>
    <span style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
    {label}
  </span>
);

const LegendSquare: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(248, 250, 252, 0.7)", fontWeight: 500 }}>
    <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
    {label}
  </span>
);

const LegendDashed: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(248, 250, 252, 0.7)", fontWeight: 500 }}>
    <span style={{ width: 14, height: 0, borderTop: `2px dashed ${color}` }} />
    {label}
  </span>
);

function Interpretation({ text }: { text: string }) {
  return (
    <div style={{ marginTop: 14, padding: 14, background: "rgba(56, 189, 248, 0.05)", borderRadius: 10, border: "1px solid rgba(56, 189, 248, 0.15)", flexShrink: 0 }}>
      <div style={{ ...pillBadgeStyle, fontSize: 11, marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-info)", boxShadow: "0 0 8px var(--color-info)" }} />
        INTERPRETATION
      </div>
      <div style={{ color: "rgba(248, 250, 252, 0.9)", fontSize: 15, lineHeight: 1.45 }}>
        {text}
      </div>
    </div>
  );
}

function Badge({ label, dotColor }: { label: string; dotColor: string }) {
  return (
    <div style={pillBadgeStyle}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
      {label}
    </div>
  );
}

function SkeletonChartCard({ height, badge, dotColor, gridItems }: { height: number; badge: string; dotColor: string, gridItems?: boolean }) {
  return (
    <div className="glass-card" style={{ padding: cardPadding, width: "100%", display: "flex", flexDirection: "column", minWidth: 0, minHeight: height + 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
        <Badge label={badge} dotColor={dotColor} />
      </div>
      <div style={{ flex: 1, display: "grid", placeItems: "center", borderRadius: 10, border: "1px dashed rgba(255, 255, 255, 0.12)", background: "rgba(255, 255, 255, 0.02)", color: "rgba(248, 250, 252, 0.82)", fontWeight: 600, letterSpacing: 0.2, minHeight: height }}>
        Loading data...
      </div>
      <Interpretation text="Preparing analytics. The layout remains fixed while querying the historical snapshots." />
    </div>
  );
}

function RiskTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as AnalyticsPoint;
  if (!point) return null;

  const statusColor =
    point.system_status === "CRITICAL" ? "#ef4444" : point.system_status === "MODERATE" ? "#eab308" : "#22c55e";

  return (
    <div style={tooltipStyle}>
      <div style={{ marginBottom: 8, fontWeight: 600, letterSpacing: 0.5, color: "rgba(255,255,255,0.9)" }}>Time: {label}</div>
      <div style={{ marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "4px 8px", color: "rgba(255,255,255,0.9)" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Risk Score</span>
        <span style={{ fontWeight: 600, color: "#f97316" }}>{point.risk_score}</span>
      </div>
      <br/>
      <div style={{ marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "4px 8px", color: "rgba(255,255,255,0.9)" }}>
        <span style={{ height: 8, width: 8, borderRadius: "50%", background: statusColor }} />
        <span>{point.system_status}</span>
      </div>
      <div style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Zone 1 People: {point.zone_1_people}</div>
      <div style={{ color: "rgba(255,255,255,0.7)" }}>Zone 2 People: {point.zone_2_people}</div>
      <div style={{ color: "rgba(255,255,255,0.7)" }}>Alert Count: {point.alert_count}</div>
    </div>
  );
}

function ZoneTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as AnalyticsPoint;
  if (!point) return null;

  return (
    <div style={tooltipStyle}>
      <div style={{ marginBottom: 8, fontWeight: 600, letterSpacing: 0.5, color: "rgba(255,255,255,0.9)" }}>Time: {label}</div>
      <div style={{ color: "rgba(255,255,255,0.7)" }}>Z1 People: {point.zone_1_people}</div>
      <div style={{ color: "rgba(255,255,255,0.7)" }}>Z2 People: {point.zone_2_people}</div>
      <div style={{ color: "rgba(255,255,255,0.7)" }}>Z1 Sensor %: {point.zone_1_validation}%</div>
      <div style={{ color: "rgba(255,255,255,0.7)" }}>Z2 Sensor %: {point.zone_2_validation}%</div>
    </div>
  );
}

function AlertTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as AnalyticsPoint;
  if (!point) return null;

  return (
    <div style={tooltipStyle}>
      <div style={{ marginBottom: 4, fontWeight: 600, letterSpacing: 0.5, color: "rgba(255,255,255,0.9)" }}>{label}</div>
      <div style={{ color: "rgba(255,255,255,0.7)" }}>{point.alert_count} alerts triggered</div>
    </div>
  );
}

const Analytics: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AnalyticsFilter>("daily");
  const [source, setSource] = useState<AnalyticsSource>("all");
  const [date, setDate] = useState<string>(today());
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshotsResponse | null>(null);
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [insightLoading, setInsightLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setInsightLoading(true);
      setError(null);

      try {
        const [snapshotPayload, insightPayload] = await Promise.all([
          fetchAnalyticsSnapshots(filter, date, source),
          fetchAnalyticsInsight(filter, date, source)
        ]);

        if (cancelled) return;

        setSnapshots(snapshotPayload);
        setInsight(insightPayload.insight || insightFallback);
      } catch (err: any) {
        if (cancelled) return;
        const message = err?.response?.data?.error?.message || err?.message || "Failed to load analytics data";
        setError(message);
        setInsight(insightFallback);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInsightLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [date, filter, source]);

  const chartData = useMemo(() => snapshots?.data ?? [], [snapshots]);

  return (
    <div style={layoutStyle}>
<motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          width: "100%",
          padding: "12px 10px 12px 24px",
          borderRadius: 9999,
          background: "rgba(11, 10, 21, 0.7)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          border: "1px solid rgba(177, 158, 239, 0.18)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)"
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => {
            if (typeof logout === "function") {
              logout();
            }
            navigate("/");
          }}
        >
          <span style={{ color: "#f8fafc", fontSize: 32, fontWeight: 800, fontFamily: "Performa, 'Plus Jakarta Sans', 'Satoshi', sans-serif", letterSpacing: 1.5, lineHeight: 0.8, flexShrink: 0 }}>
            SENTINEL
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            padding: "4px",
            gap: 4
          }}>
            {FILTERS.map((option) => {
              const isActive = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  style={
                    isActive
                      ? {
                          ...pillBadgeStyle,
                          padding: "7px 14px",
                          fontSize: 12,
                          letterSpacing: 0.8,
                          boxShadow: "none"
                        }
                      : {
                          padding: "7px 14px",
                          borderRadius: 9999,
                          background: "transparent",
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: 0.8,
                          textTransform: "uppercase",
                          cursor: "pointer",
                          border: "1px solid transparent",
                          transition: "all 0.2s"
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                  }}
                >
                  {isActive && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#f97316",
                        boxShadow: "0 0 8px #f97316"
                      }}
                    />
                  )}
                  {formatFilterLabel(option)}
                </button>
              );
            })}
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              style={{ 
                background: "transparent", 
                border: "none", 
                color: "rgba(255,255,255,0.7)", 
                fontSize: 13,
                fontWeight: 500,
                padding: "4px 8px",
                cursor: "pointer",
                colorScheme: "dark",
                outline: "none"
              }}
            />
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4, borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 12 }}>
              {SOURCES.map((option) => {
                const isActive = source === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSource(option.value)}
                    style={
                      isActive
                        ? {
                            ...pillBadgeStyle,
                            padding: "7px 14px",
                            fontSize: 12,
                            letterSpacing: 0.8,
                            boxShadow: "none"
                          }
                        : {
                            padding: "7px 14px",
                            borderRadius: 9999,
                            background: "transparent",
                            color: "rgba(255,255,255,0.4)",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: 0.8,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            border: "1px solid transparent",
                            transition: "all 0.2s",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: option.dotColor,
                          boxShadow: `0 0 8px ${option.dotColor}`
                        }}
                      />
                    )}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Link
            to="/dashboard"
            style={{
              padding: "10px 18px",
              borderRadius: 9999,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#f8fafc",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              transition: "all 0.2s",
              fontFamily: "var(--font-ui)",
            }}
          >
            Back to Dashboard
          </Link>

          {user?.organizationId === "SENTINELADMINUNIQUE" && (
            <Link
              to="/admin"
              style={{
                padding: "10px 18px",
                borderRadius: 9999,
                background: "rgba(127, 29, 29, 0.32)",
                border: "1px solid rgba(248, 113, 113, 0.45)",
                color: "#fecaca",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                transition: "all 0.2s",
                fontFamily: "var(--font-ui)",
                letterSpacing: 0.4,
                textTransform: "uppercase"
              }}
            >
              ● Admin
            </Link>
          )}
        </div>
      </motion.header>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", color: "rgba(254, 202, 202, 0.9)", fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
          <SkeletonChartCard height={280} badge="RISK SCORE OVER TIME" dotColor="#f97316" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "stretch" }}>
            <SkeletonChartCard height={260} badge="ZONE ACTIVITY + VALIDATION" dotColor="#06b6d4" gridItems />
            <SkeletonChartCard height={260} badge="ALERT FREQUENCY" dotColor="#ef4444" gridItems />
          </div>
        </div>
      ) : (
        <motion.div 
          key={filter}
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}
        >
          {/* Chart 1 */}
          <section className="glass-card" style={{ padding: cardPadding, width: "100%", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 300 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
              <Badge label="RISK SCORE OVER TIME" dotColor="#f97316" />
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <LegendDot color="#22c55e" label="Safe 0-40" />
                <LegendDot color="#eab308" label="Moderate 41-75" />
                <LegendDot color="#ef4444" label="Critical 76-100" />
              </div>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={chartTickStyle} axisLine={{ stroke: gridStroke }} tickLine={{ stroke: gridStroke }} />
                  <YAxis domain={[0, 100]} tick={chartTickStyle} axisLine={{ stroke: gridStroke }} tickLine={{ stroke: gridStroke }} />
                  <ReferenceArea y1={0} y2={40} fill="#22c55e" fillOpacity={0.08} />
                  <ReferenceArea y1={40} y2={75} fill="#eab308" fillOpacity={0.08} />
                  <ReferenceArea y1={75} y2={100} fill="#ef4444" fillOpacity={0.1} />
                  <Tooltip content={<RiskTooltip />} />
                  <Line type="monotone" dataKey="risk_score" stroke="#f97316" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Interpretation text="Risk score tracks live crowd pressure across both zones. Colored bands show safe (green), moderate (yellow) and critical (red) operating thresholds." />
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "stretch" }}>
            {/* Chart 2 */}
            <section className="glass-card" style={{ padding: cardPadding, width: "100%", height: "100%", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 300 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
                <Badge label="ZONE ACTIVITY + VALIDATION" dotColor="#06b6d4" />
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <LegendSquare color="#6366f1" label="Z1 People" />
                  <LegendSquare color="#06b6d4" label="Z2 People" />
                  <LegendDashed color="#a78bfa" label="Z1 Sensor %" />
                  <LegendDashed color="#22d3ee" label="Z2 Sensor %" />
                </div>
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={chartTickStyle} axisLine={{ stroke: gridStroke }} tickLine={{ stroke: gridStroke }} />
                    <YAxis yAxisId="left" domain={[0, 30]} tick={chartTickStyle} axisLine={{ stroke: gridStroke }} tickLine={{ stroke: gridStroke }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      label={{ value: "%", angle: 0, position: "insideTopRight", offset: 8, fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                      tick={chartTickStyle}
                      axisLine={{ stroke: gridStroke }}
                      tickLine={{ stroke: gridStroke }}
                    />
                    <Tooltip content={<ZoneTooltip />} />
                    <Area type="monotone" yAxisId="left" dataKey="zone_1_people" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                    <Area type="monotone" yAxisId="left" dataKey="zone_2_people" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                    <Line type="monotone" yAxisId="right" dataKey="zone_1_validation" stroke="#a78bfa" strokeDasharray="4 2" dot={false} />
                    <Line type="monotone" yAxisId="right" dataKey="zone_2_validation" stroke="#22d3ee" strokeDasharray="4 2" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <Interpretation text="Solid areas show camera-detected people per zone. Dashed lines show PIR+IR sensor validation confidence (0-100%). High overlap indicates strong detection agreement." />
            </section>

            {/* Chart 3 */}
            <section className="glass-card" style={{ padding: cardPadding, width: "100%", height: "100%", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 300 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
                <Badge label="ALERT FREQUENCY" dotColor="#ef4444" />
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <LegendSquare color="#1f2937" label="No alerts" />
                  <LegendSquare color="#eab308" label="Warning (1-2)" />
                  <LegendSquare color="#ef4444" label="Critical (3+)" />
                </div>
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={chartTickStyle} axisLine={{ stroke: gridStroke }} tickLine={{ stroke: gridStroke }} />
                    <YAxis tick={chartTickStyle} axisLine={{ stroke: gridStroke }} tickLine={{ stroke: gridStroke }} />
                    <Tooltip content={<AlertTooltip />} />
                    <Bar dataKey="alert_count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`alert-bar-${entry.timestamp}-${index}`} fill={getAlertBarColor(entry.alert_count)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Interpretation text="Alert frequency highlights periods of elevated crowd risk. Yellow bars indicate warning-level events. Red bars indicate critical congestion requiring immediate action." />
            </section>
          </div>
        </motion.div>
      )}

      {/* Insight Section */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="glass-card"
        style={{
          borderLeft: "4px solid #f97316",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          minWidth: 0
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Badge label="SENTINEL INSIGHT" dotColor="#f97316" />
        </div>
        {insightLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton height={12} width="100%" radius={4} />
            <Skeleton height={12} width="80%" radius={4} />
            <Skeleton height={12} width="60%" radius={4} />
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "rgba(248, 250, 252, 0.85)" }}>
            {insight || <span style={{ color: "rgba(255,255,255,0.3)" }}>{insightFallback}</span>}
          </p>
        )}
      </motion.section>
    </div>
  );
};

export default Analytics;