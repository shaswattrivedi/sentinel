import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePolicy } from "../middleware/rbac.js";
import { success } from "../utils/response.js";
import { riskService } from "../services/riskService.js";
import { mlClient } from "../services/mlClient.js";
import { alertService } from "../services/alertService.js";

export const router = Router();

router.get("/current", authenticate, requirePolicy("risk:read"), (req, res) => {
  const zoneId = typeof req.query.zoneId === "string" ? req.query.zoneId : undefined;
  const current = riskService.getCurrent(zoneId);
  return res.json(success(req, { current }));
});

router.get("/timeline", authenticate, requirePolicy("risk:read"), (req, res) => {
  const start = typeof req.query.start === "string" ? new Date(req.query.start) : undefined;
  const end = typeof req.query.end === "string" ? new Date(req.query.end) : undefined;
  const events = riskService.getTimeline(start, end);
  return res.json(success(req, { events }));
});

router.get("/prediction", authenticate, requirePolicy("risk:read"), async (req, res) => {
  const horizon = typeof req.query.horizon === "string" ? parseInt(req.query.horizon, 10) : 30;
  const zoneId = typeof req.query.zoneId === "string" ? req.query.zoneId : "zone-1";

  try {
    const prediction = await mlClient.predictCrowdTrend({ zoneId, horizonMinutes: Number.isFinite(horizon) ? horizon : 30 });
    if (prediction.predictedCount > 100) {
      alertService.triggerPredictionAlert(prediction);
    }
    return res.json(success(req, { prediction }));
  } catch (_error) {
    return res.json(success(req, { prediction: null, source: "fallback" }));
  }
});

router.get("/incidents", authenticate, requirePolicy("risk:read"), (req, res) => {
  return res.json(success(req, { incidents: [] }));
});
