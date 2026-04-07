export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type SystemStatus = "SAFE" | "MODERATE" | "CRITICAL" | "UNKNOWN";

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
  confidence?: number; // 0-1
  rationale?: string;
  updatedAt: string;
};

export type ZoneStatus = {
  z1: SystemStatus;
  z2: SystemStatus;
  z3: SystemStatus;
};

export type HardwareCommands = {
  z2_led: "green" | "yellow" | "red" | "gray";
  z3_led: "green" | "yellow" | "red" | "gray";
  z2_buzzer: boolean;
  z3_buzzer: boolean;
};

export type TrendPrediction = {
  trend: "INCREASING" | "STABLE" | "DECREASING" | "UNKNOWN";
  prediction: "LOW_TREND" | "MODERATE_TREND" | "HIGH_RISK" | "NO_DATA";
  predicted_density: number;
  confidence: number;
};

export type HardwareStatusResponse = {
  timestamp: string | null;
  zone_status: ZoneStatus;
  hardware_commands: HardwareCommands;
  trend_prediction: TrendPrediction;
  risk_score: number;
  z1_people_count: number;
  latest_annotated_frame: string | null;
};

export type DashboardSnapshotData = {
  riskScore: number;
  systemStatus: SystemStatus;
  zoneStatus: ZoneStatus;
  hardwareCommands: HardwareCommands;
  trendPrediction: TrendPrediction;
  latestAnnotatedFrame: string | null;
  z1PeopleCount: number;
  lastUpdated: string | null;
};

export type OverviewPayload = { data: OverviewResponse };
export type TimelinePayload = { data: TimelinePoint[] };
export type FlowPayload = { data: FlowPoint[] };
export type AlertsPayload = { data: AlertItem[] };
export type DecisionPayload = { data: DecisionResponse };
export type HardwareStatusPayload = { data: HardwareStatusResponse };
