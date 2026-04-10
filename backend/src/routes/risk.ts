import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePolicy } from "../middleware/rbac.js";
import { success } from "../utils/response.js";
import { riskService } from "../services/riskService.js";
import { mlClient } from "../services/mlClient.js";
import { alertService } from "../services/alertService.js";
import { HttpError } from "../middleware/errorHandler.js";
import { RequestWithUser } from "../middleware/auth.js";

export const router = Router();

const getOrganizationId = (req: RequestWithUser): string => {
  const orgId = req.user?.organizationId?.trim();
  if (!orgId) {
    throw new HttpError(401, "AUTH_401", "Organization context missing");
  }
  return orgId;
};

router.get("/current", authenticate, requirePolicy("risk:read"), (req: RequestWithUser, res, next) => {
  try {
    const organizationId = getOrganizationId(req);
    const zoneId = typeof req.query.zoneId === "string" ? req.query.zoneId : undefined;
    const current = riskService.getCurrent(organizationId, zoneId);
    return res.json(success(req, { current }));
  } catch (error) {
    return next(error);
  }
});

router.get("/timeline", authenticate, requirePolicy("risk:read"), (req: RequestWithUser, res, next) => {
  try {
    const organizationId = getOrganizationId(req);
    const start = typeof req.query.start === "string" ? new Date(req.query.start) : undefined;
    const end = typeof req.query.end === "string" ? new Date(req.query.end) : undefined;
    const events = riskService.getTimeline(organizationId, start, end);
    return res.json(success(req, { events }));
  } catch (error) {
    return next(error);
  }
});

router.get("/prediction", authenticate, requirePolicy("risk:read"), async (req: RequestWithUser, res, next) => {
  try {
    const organizationId = getOrganizationId(req);
    const horizon = typeof req.query.horizon === "string" ? parseInt(req.query.horizon, 10) : 30;
    const zoneId = typeof req.query.zoneId === "string" ? req.query.zoneId : "zone-1";

    const prediction = await mlClient.predictCrowdTrend({ zoneId, horizonMinutes: Number.isFinite(horizon) ? horizon : 30 });
    if (prediction.predictedCount > 100) {
      alertService.triggerPredictionAlert(prediction, organizationId);
    }
    return res.json(success(req, { prediction }));
  } catch (_error) {
    if (_error instanceof HttpError) return next(_error);
    return res.json(success(req, { prediction: null, source: "fallback" }));
  }
});

router.get("/incidents", authenticate, requirePolicy("risk:read"), (req: RequestWithUser, res) => {
  return res.json(success(req, { incidents: [] }));
});
