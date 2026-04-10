import { randomUUID } from "crypto";
import { HttpError } from "../middleware/errorHandler.js";
import type { RiskEvent } from "./riskService.js";
import { incrementAlertCount } from "./snapshotService.js";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Alert {
  id: string;
  type: "RISK_ESCALATION" | "PREDICTION";
  severity: AlertSeverity;
  explanation: string;
  acknowledged: boolean;
  createdAt: string;
  source?: RiskEvent;
}

const DEFAULT_ORGANIZATION_ID = "default-org";
const alertsByOrganization = new Map<string, Alert[]>();

const normalizeOrganizationId = (organizationId: string | undefined): string => {
  const normalized = organizationId?.trim();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_ORGANIZATION_ID;
};

const getOrganizationAlerts = (organizationId: string): Alert[] => {
  const orgId = normalizeOrganizationId(organizationId);
  let alerts = alertsByOrganization.get(orgId);
  if (!alerts) {
    alerts = [];
    alertsByOrganization.set(orgId, alerts);
  }
  return alerts;
};

export const alertService = {
  list(organizationId: string): Alert[] {
    const alerts = getOrganizationAlerts(organizationId);
    return [...alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  acknowledge(id: string, organizationId: string): Alert {
    const alerts = getOrganizationAlerts(organizationId);
    const alert = alerts.find((a) => a.id === id);
    if (!alert) throw new HttpError(404, "DATA_404", "Alert not found");
    alert.acknowledged = true;
    return alert;
  },

  triggerRiskEscalation(event: RiskEvent, previous: RiskEvent, organizationId: string) {
    const alerts = getOrganizationAlerts(organizationId);
    const severity: AlertSeverity = event.riskState === "DANGER" ? "CRITICAL" : "MEDIUM";
    const explanation = `Risk escalated from ${previous.riskState} to ${event.riskState} in ${event.zoneId}`;
    alerts.push({
      id: randomUUID(),
      type: "RISK_ESCALATION",
      severity,
      explanation,
      acknowledged: false,
      createdAt: new Date().toISOString(),
      source: event
    });
    incrementAlertCount(organizationId);
  },

  triggerPredictionAlert(prediction: { predictedCount: number; confidence: number; timeWindow: string }, organizationId: string) {
    const alerts = getOrganizationAlerts(organizationId);
    if (prediction.predictedCount < 0) return;
    const severity: AlertSeverity = prediction.predictedCount > 100 ? "HIGH" : "MEDIUM";
    const explanation = `Predicted crowd count ${prediction.predictedCount} in ${prediction.timeWindow} (confidence ${Math.round(
      prediction.confidence * 100
    )}%)`;
    alerts.push({
      id: randomUUID(),
      type: "PREDICTION",
      severity,
      explanation,
      acknowledged: false,
      createdAt: new Date().toISOString()
    });
    incrementAlertCount(organizationId);
  }
};
