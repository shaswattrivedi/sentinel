import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAlerts, getDashboardSnapshot, getDecision, getFlow, getOverview, getTimeline } from "@/api/dashboard";
import {
  AlertItem,
  DashboardSnapshotData,
  DecisionResponse,
  FlowPoint,
  HardwareCommands,
  HardwareStatusResponse,
  OverviewResponse,
  SystemStatus,
  TimelinePoint,
  TrendPrediction,
  ZoneStatus
} from "@/types/ml";

export type DashboardDataState = DashboardSnapshotData & {
  overview: OverviewResponse | null;
  timeline: TimelinePoint[];
  flow: FlowPoint[];
  alerts: AlertItem[];
  decision: DecisionResponse | null;
  hardware: HardwareStatusResponse | null;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
};

const UNKNOWN_ZONE_STATUS: ZoneStatus = { z1: "UNKNOWN", z2: "UNKNOWN", z3: "UNKNOWN" };
const DEFAULT_HARDWARE_COMMANDS: HardwareCommands = {
  z2_led: "gray",
  z3_led: "gray"
};
const DEFAULT_TREND: TrendPrediction = {
  trend: "UNKNOWN",
  prediction: "NO_DATA",
  predicted_density: 0,
  confidence: 0
};

const deriveSystemStatus = (zoneStatus: ZoneStatus): SystemStatus => {
  const statuses = Object.values(zoneStatus);
  if (statuses.includes("CRITICAL")) return "CRITICAL";
  if (statuses.includes("MODERATE")) return "MODERATE";
  if (statuses.includes("SAFE")) return "SAFE";
  return "UNKNOWN";
};

const defaultState: DashboardDataState = {
  overview: null,
  timeline: [],
  flow: [],
  alerts: [],
  decision: null,
  hardware: null,
  riskScore: 0,
  systemStatus: "UNKNOWN",
  zoneStatus: UNKNOWN_ZONE_STATUS,
  hardwareCommands: DEFAULT_HARDWARE_COMMANDS,
  trendPrediction: DEFAULT_TREND,
  latestAnnotatedFrame: null,
  z1PeopleCount: 0,
  lastUpdated: null,
  loading: true,
  isLoading: true,
  error: null
};

export const useMLDashboardData = (pollIntervalMs = 1500) => {
  const [state, setState] = useState<DashboardDataState>(defaultState);
  const hasFetchedOnceRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!hasFetchedOnceRef.current) {
      setState((prev) => ({ ...prev, loading: true, isLoading: true, error: null }));
    } else {
      // Keep existing content mounted during refresh/polling so scroll position is preserved.
      setState((prev) => ({ ...prev, error: null }));
    }
    try {
      const [overview, timeline, flow, alerts, decision, snapshot] = await Promise.all([
        getOverview(),
        getTimeline(),
        getFlow(),
        getAlerts(),
        getDecision(),
        getDashboardSnapshot()
      ]);

      const zoneStatus = snapshot?.zone_status ?? UNKNOWN_ZONE_STATUS;
      const hardwareCommands = snapshot?.hardware_commands ?? DEFAULT_HARDWARE_COMMANDS;
      const trendPrediction = snapshot?.trend_prediction ?? DEFAULT_TREND;
      const riskScore = typeof snapshot?.risk_score === "number" ? snapshot.risk_score : overview.riskScore;
      const z1PeopleCount = typeof snapshot?.z1_people_count === "number" ? snapshot.z1_people_count : 0;

      setState({
        overview,
        timeline,
        flow,
        alerts,
        decision,
        hardware: snapshot,
        riskScore,
        systemStatus: deriveSystemStatus(zoneStatus),
        zoneStatus,
        hardwareCommands,
        trendPrediction,
        latestAnnotatedFrame: snapshot?.latest_annotated_frame ?? null,
        z1PeopleCount,
        lastUpdated: snapshot?.timestamp ?? overview.lastUpdated,
        loading: false,
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to load dashboard data";
      setState((prev) => ({ ...prev, loading: false, isLoading: false, error: message }));
    } finally {
      hasFetchedOnceRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetchData, pollIntervalMs]);

  const value = useMemo(
    () => ({ ...state, refresh: fetchData }),
    [state, fetchData]
  );

  return value;
};
