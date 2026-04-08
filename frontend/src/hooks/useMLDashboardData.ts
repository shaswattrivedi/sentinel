import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAlerts, getDashboardSnapshot, getDecision, getFlow, getOverview, getTimeline } from "@/api/dashboard";
import {
  AlertItem,
  DecisionResponse,
  FlowPoint,
  HardwareStatusResponse,
  MLDashboardState,
  OverviewResponse,
  TimelinePoint,
} from "@/types/ml";

export type DashboardDataState = MLDashboardState & {
  overview: OverviewResponse | null;
  timeline: TimelinePoint[];
  flow: FlowPoint[];
  alertsPanel: AlertItem[];
  decision: DecisionResponse | null;
  hardware: HardwareStatusResponse | null;
};

const DEFAULT_SNAPSHOT: HardwareStatusResponse = {
  risk_score: 0,
  system_status: "SAFE",
  zone_status: {
    "zone-1": "SAFE",
    "zone-2": "SAFE",
  },
  zone_data: {
    "zone-1": { cam_people_count: 0, validation_score: 0 },
    "zone-2": { cam_people_count: 0, validation_score: 0 },
  },
  annotated_frames: {
    "zone-1": null,
    "zone-2": null,
  },
  trend_prediction: {
    trend: "STABLE",
    prediction: "LOW_TREND",
    predicted_density: 0,
    confidence: 0.75,
  },
  alerts: [],
  timestamp: new Date().toISOString(),
};

const defaultState: DashboardDataState = {
  ...DEFAULT_SNAPSHOT,
  overview: null,
  timeline: [],
  flow: [],
  alertsPanel: [],
  decision: null,
  hardware: null,
  isLoading: true,
  error: null,
};

const normalizeSnapshot = (snapshot?: Partial<HardwareStatusResponse> | null): HardwareStatusResponse => ({
  ...DEFAULT_SNAPSHOT,
  ...snapshot,
  zone_status: {
    ...DEFAULT_SNAPSHOT.zone_status,
    ...(snapshot?.zone_status ?? {}),
  },
  zone_data: {
    ...DEFAULT_SNAPSHOT.zone_data,
    ...(snapshot?.zone_data ?? {}),
  },
  annotated_frames: {
    ...DEFAULT_SNAPSHOT.annotated_frames,
    ...(snapshot?.annotated_frames ?? {}),
  },
  trend_prediction: {
    ...DEFAULT_SNAPSHOT.trend_prediction,
    ...(snapshot?.trend_prediction ?? {}),
  },
  alerts: Array.isArray(snapshot?.alerts) ? snapshot.alerts : [],
  timestamp: snapshot?.timestamp ?? new Date().toISOString(),
});

export const useMLDashboardData = (pollIntervalMs = 1500) => {
  const [state, setState] = useState<DashboardDataState>(defaultState);
  const hasFetchedOnceRef = useRef(false);

  const fetchSnapshot = useCallback(async () => {
    const snapshot = await getDashboardSnapshot();
    const normalizedSnapshot = normalizeSnapshot(snapshot);

    setState((prev) => ({
      ...prev,
      ...normalizedSnapshot,
      hardware: normalizedSnapshot,
      isLoading: false,
      error: null,
    }));
  }, []);

  const fetchSupportingData = useCallback(async () => {
    const [overview, timeline, flow, alertsPanel, decision] = await Promise.all([
      getOverview(),
      getTimeline(),
      getFlow(),
      getAlerts(),
      getDecision(),
    ]);

    setState((prev) => ({
      ...prev,
      overview,
      timeline,
      flow,
      alertsPanel,
      decision,
      error: null,
    }));
  }, []);

  const refresh = useCallback(async () => {
    if (!hasFetchedOnceRef.current) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    } else {
      setState((prev) => ({ ...prev, error: null }));
    }

    try {
      await Promise.all([fetchSnapshot(), fetchSupportingData()]);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to load dashboard data";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    } finally {
      hasFetchedOnceRef.current = true;
    }
  }, [fetchSnapshot, fetchSupportingData]);

  useEffect(() => {
    refresh();

    const id = setInterval(async () => {
      try {
        await fetchSnapshot();
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "Snapshot polling failed";
        setState((prev) => ({ ...prev, error: message }));
      }
    }, pollIntervalMs);

    return () => clearInterval(id);
  }, [fetchSnapshot, pollIntervalMs, refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
  return value;
};
