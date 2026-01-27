import { randomUUID } from "crypto";
import { HttpError } from "../middleware/errorHandler.js";
const alerts = [];
export const alertService = {
    list() {
        return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    acknowledge(id) {
        const alert = alerts.find((a) => a.id === id);
        if (!alert)
            throw new HttpError(404, "DATA_404", "Alert not found");
        alert.acknowledged = true;
        return alert;
    },
    triggerRiskEscalation(event, previous) {
        const severity = event.riskState === "DANGER" ? "CRITICAL" : "MEDIUM";
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
    },
    triggerPredictionAlert(prediction) {
        if (prediction.predictedCount < 0)
            return;
        const severity = prediction.predictedCount > 100 ? "HIGH" : "MEDIUM";
        const explanation = `Predicted crowd count ${prediction.predictedCount} in ${prediction.timeWindow} (confidence ${Math.round(prediction.confidence * 100)}%)`;
        alerts.push({
            id: randomUUID(),
            type: "PREDICTION",
            severity,
            explanation,
            acknowledged: false,
            createdAt: new Date().toISOString()
        });
    }
};
