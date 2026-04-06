import { useCallback, useEffect, useMemo, useState } from "react";
import { getAlerts, getDecision, getFlow, getHardwareStatus, getOverview, getTimeline } from "@/api/dashboard";
import { AlertItem, DecisionResponse, FlowPoint, HardwareStatusResponse, OverviewResponse, TimelinePoint } from "@/types/ml";

export type DashboardDataState = {
  overview: OverviewResponse | null;
  timeline: TimelinePoint[];
  flow: FlowPoint[];
  alerts: AlertItem[];
  decision: DecisionResponse | null;
  hardware: HardwareStatusResponse | null;
  loading: boolean;
  error: string | null;
};

const defaultState: DashboardDataState = {
  overview: null,
  timeline: [],
  flow: [],
  alerts: [],
  decision: null,
  hardware: null,
  loading: true,
  error: null
};

export const useMLDashboardData = (pollIntervalMs = 15000) => {
  const [state, setState] = useState<DashboardDataState>(defaultState);

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [overview, timeline, flow, alerts, decision, hardware] = await Promise.all([
        getOverview(),
        getTimeline(),
        getFlow(),
        getAlerts(),
        getDecision(),
        getHardwareStatus()
      ]);
      setState({
        overview,
        timeline,
        flow,
        alerts,
        decision,
        hardware,
        loading: false,
        error: null
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to load dashboard data";
      setState((prev) => ({ ...prev, loading: false, error: message }));
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
