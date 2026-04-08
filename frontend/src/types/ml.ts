export type ZoneStatusLevel = "SAFE" | "MODERATE" | "CRITICAL";
export type SystemStatus = "SAFE" | "MODERATE" | "CRITICAL";
export type TrendDirection = "INCREASING" | "STABLE" | "DECREASING";
export type TrendPrediction = "LOW_TREND" | "MODERATE_TREND" | "HIGH_RISK";

export interface ZoneData {
  cam_people_count: number;
  validation_score: number;
}

export interface Alert {
  severity: "WARNING" | "CRITICAL";
  message: string;
  timestamp: string;
}

export interface TrendData {
  trend: TrendDirection;
  prediction: TrendPrediction;
  predicted_density: number;
  confidence: number;
}

export interface DashboardSnapshot {
  risk_score: number;
  system_status: SystemStatus;
  zone_status: {
    "zone-1": ZoneStatusLevel;
    "zone-2": ZoneStatusLevel;
  };
  zone_data: {
    "zone-1": ZoneData;
    "zone-2": ZoneData;
  };
  annotated_frames: {
    "zone-1": string | null;
    "zone-2": string | null;
  };
  trend_prediction: TrendData;
  alerts: Alert[];
  timestamp: string;
}

export interface MLDashboardState extends DashboardSnapshot {
  isLoading: boolean;
  error: string | null;
}

// Compatibility types used by analytics/decision panels.
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type OverviewResponse = {
  riskScore: number;
  riskLevel: RiskLevel;
  densityLevel: RiskLevel;
  flow: {
    inflow: number;
    outflow: number;
    net: number;
  };
  lastUpdated: string;
};

export type TimelinePoint = {
  timestamp: string;
  riskScore: number;
  densityLevel: RiskLevel;
};

export type FlowPoint = {
  timestamp: string;
  inflow: number;
  outflow: number;
  net: number;
};

export type AlertItem = {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
};

export type DecisionResponse = {
  state: "NORMAL" | "WARNING" | "EVACUATE";
  recommendedDirection?: string;
  confidence?: number;
  rationale?: string;
  updatedAt: string;
};

export type HardwareStatusResponse = DashboardSnapshot;

export type OverviewPayload = { data: OverviewResponse };
export type TimelinePayload = { data: TimelinePoint[] };
export type FlowPayload = { data: FlowPoint[] };
export type AlertsPayload = { data: AlertItem[] };
export type DecisionPayload = { data: DecisionResponse };
export type HardwareStatusPayload = { data: HardwareStatusResponse };
