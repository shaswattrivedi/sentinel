import mlApi from "@/api/mlClient";
import {
  AlertItem,
  DecisionResponse,
  FlowPoint,
  HardwareStatusResponse,
  OverviewResponse,
  RiskLevel,
  TimelinePoint
} from "@/types/ml";

// Backend API types (snake_case)
type BackendOverview = {
  timestamp: string | null;
  zone_id: string;
  crowd_count: number;
  density_level: string;
  risk_level: string;
  risk_score: number;
  risk_color: string;
  system_state: string;
  fusion_confidence: number;
};

type BackendTimelinePoint = {
  timestamp: string;
  risk_score: number;
  risk_level: string;
  density_level: string;
};

type BackendFlowPoint = {
  timestamp: string;
  inflow_rate_per_min: number;
  outflow_rate_per_min: number;
  net_flow_per_min: number;
};

type BackendAlert = {
  timestamp: string;
  alert_status: boolean;
  alert_severity: string;
  explanation: string;
};

type BackendDecision = {
  timestamp: string | null;
  risk_level: string;
  recommendation: string;
  direction: string;
  confidence: number;
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const toRiskLevel = (value: unknown): RiskLevel => {
  const upper = String(value ?? "").toUpperCase();
  if (upper === "LOW") return "LOW";
  if (upper === "MEDIUM") return "MEDIUM";
  if (upper === "HIGH") return "HIGH";
  if (upper === "SAFE") return "LOW";
  if (upper === "MODERATE") return "MEDIUM";
  if (upper === "CRITICAL") return "HIGH";
  return "LOW";
};

export const getOverview = async (): Promise<OverviewResponse> => {
  const res = await mlApi.get<BackendOverview>("/dashboard/overview");
  const data = res.data;
  
  return {
    riskScore: data.risk_score,
    riskLevel: toRiskLevel(data.risk_level),
    densityLevel: toRiskLevel(data.density_level),
    flow: {
      inflow: 0,
      outflow: 0,
      net: 0
    },
    lastUpdated: data.timestamp || new Date().toISOString()
  };
};

export const getTimeline = async (): Promise<TimelinePoint[]> => {
  const res = await mlApi.get<{ points: BackendTimelinePoint[] }>("/dashboard/timeline");
  return asArray<BackendTimelinePoint>(res.data?.points).map((p) => ({
    timestamp: p.timestamp,
    riskScore: p.risk_score,
    densityLevel: toRiskLevel(p.density_level)
  }));
};

export const getFlow = async (): Promise<FlowPoint[]> => {
  const res = await mlApi.get<any>("/dashboard/flow");
  const points = asArray<BackendFlowPoint>(res.data?.points);
  
  // Handle gracefully whether backend returns { points: [...] } or the old single object
  if (points.length) {
    return points.map((p) => ({
      timestamp: p.timestamp,
      inflow: p.inflow_rate_per_min,
      outflow: p.outflow_rate_per_min,
      net: p.net_flow_per_min
    }));
  } else if (res.data && typeof res.data.inflow_rate_per_min === "number") {
    // Fallback for old backend format before restart
    return [{
      timestamp: res.data.timestamp,
      inflow: res.data.inflow_rate_per_min,
      outflow: res.data.outflow_rate_per_min,
      net: res.data.net_flow_per_min
    }];
  }

  return [];
};

export const getAlerts = async (): Promise<AlertItem[]> => {
  const res = await mlApi.get<{ alerts: BackendAlert[] }>("/dashboard/alerts");
  return asArray<BackendAlert>(res.data?.alerts).map((a, idx) => ({
    id: `alert-${idx}-${a.timestamp}`,
    severity: a.alert_severity.toLowerCase() === 'critical' ? 'critical' : 
              a.alert_severity.toLowerCase() === 'elevated' ? 'warning' : 'info',
    message: a.explanation,
    timestamp: a.timestamp
  }));
};

export const getDecision = async (): Promise<DecisionResponse> => {
  const res = await mlApi.get<BackendDecision>("/dashboard/decision");
  const data = res.data;
  
  const stateMap: Record<string, "NORMAL" | "WARNING" | "EVACUATE"> = {
    "LOW": "NORMAL",
    "MEDIUM": "WARNING",
    "HIGH": "EVACUATE",
    "SAFE": "NORMAL",
    "MODERATE": "WARNING",
    "CRITICAL": "EVACUATE",
    "NO_DATA": "NORMAL",
    "UNKNOWN": "NORMAL"
  };
  
  return {
    state: stateMap[data.risk_level] || "NORMAL",
    recommendedDirection: data.direction,
    confidence: data.confidence,
    rationale: data.recommendation,
    updatedAt: data.timestamp || new Date().toISOString()
  };
};

export const getHardwareStatus = async (): Promise<HardwareStatusResponse> => {
  const res = await mlApi.get<HardwareStatusResponse>("/dashboard/snapshot");
  return res.data;
};

export const getDashboardSnapshot = async (): Promise<HardwareStatusResponse> => {
  const res = await mlApi.get<HardwareStatusResponse>("/dashboard/snapshot");
  return res.data;
};

export const resetDashboardState = async (): Promise<void> => {
  await mlApi.post("/dashboard/reset");
};
