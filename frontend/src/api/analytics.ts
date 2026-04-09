import { client } from "./client";

export type AnalyticsFilter = "daily" | "weekly" | "monthly";

export type AnalyticsPoint = {
  label: string;
  timestamp: string;
  risk_score: number;
  system_status: "SAFE" | "MODERATE" | "CRITICAL";
  zone_1_people: number;
  zone_2_people: number;
  zone_1_validation: number;
  zone_2_validation: number;
  alert_count: number;
  trend: "INCREASING" | "STABLE" | "DECREASING";
};

export type AnalyticsSummary = {
  avg_risk_score: number;
  peak_risk_score: number;
  peak_time: string | null;
  total_alerts: number;
  dominant_status: "SAFE" | "MODERATE" | "CRITICAL";
  dominant_trend: "INCREASING" | "STABLE" | "DECREASING";
};

export type AnalyticsSnapshotsResponse = {
  filter: AnalyticsFilter;
  date: string;
  data: AnalyticsPoint[];
  summary: AnalyticsSummary;
};

export type AnalyticsInsightResponse = {
  filter: AnalyticsFilter;
  date: string;
  insight: string;
};

function unwrapPayload<T>(payload: any): T {
  if (payload?.status === "success" && payload?.data) {
    return payload.data as T;
  }
  return payload as T;
}

export async function fetchAnalyticsSnapshots(filter: AnalyticsFilter, date: string): Promise<AnalyticsSnapshotsResponse> {
  const { data } = await client.get("/analytics/snapshots", {
    params: { filter, date }
  });
  return unwrapPayload<AnalyticsSnapshotsResponse>(data);
}

export async function fetchAnalyticsInsight(filter: AnalyticsFilter, date: string): Promise<AnalyticsInsightResponse> {
  const { data } = await client.get("/analytics/insight", {
    params: { filter, date }
  });
  return unwrapPayload<AnalyticsInsightResponse>(data);
}