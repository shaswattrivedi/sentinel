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
  confidence?: number; // 0-1
  rationale?: string;
  updatedAt: string;
};

export type OverviewPayload = { data: OverviewResponse };
export type TimelinePayload = { data: TimelinePoint[] };
export type FlowPayload = { data: FlowPoint[] };
export type AlertsPayload = { data: AlertItem[] };
export type DecisionPayload = { data: DecisionResponse };
