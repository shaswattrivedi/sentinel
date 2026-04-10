import { Router } from "express";
import { RequestWithUser, authenticate } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { requirePolicy } from "../middleware/rbac.js";
import {
  getAllSimulationStatuses,
  getScenarios,
  getSimulationStatus,
  startSimulation,
  stopSimulation
} from "../services/adminSimulatorService.js";
import { success } from "../utils/response.js";

export const router = Router();

router.use(authenticate);
router.use(requirePolicy("admin:simulate"));

router.get("/scenarios", (req, res) => {
  return res.json(success(req, getScenarios()));
});

router.get("/simulate/status", (req, res) => {
  return res.json(success(req, getAllSimulationStatuses()));
});

router.get("/simulate/status/:orgId", (req, res) => {
  return res.json(success(req, getSimulationStatus(req.params.orgId)));
});

router.post("/simulate/start", async (req: RequestWithUser, res, next) => {
  try {
    const body = (req.body ?? {}) as { orgId?: unknown; scenario?: unknown; duration?: unknown };
    const orgId = typeof body.orgId === "string" ? body.orgId.trim() : "";
    const scenario = Number(body.scenario);
    const duration = body.duration === undefined ? 60 : Number(body.duration);

    if (!orgId || !Number.isFinite(scenario)) {
      throw new HttpError(400, "REQ_400", "orgId and scenario are required");
    }

    await startSimulation(orgId, scenario, Number.isFinite(duration) ? duration : 60);

    return res.json(
      success(req, {
        message: `Simulation started for ${orgId}`,
        orgId,
        scenario,
        duration: Number.isFinite(duration) ? duration : 60
      })
    );
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(new HttpError(500, "SIM_500", "Failed to start simulation"));
  }
});

router.post("/simulate/stop", (req, res, next) => {
  try {
    const body = (req.body ?? {}) as { orgId?: unknown };
    const orgId = typeof body.orgId === "string" ? body.orgId.trim() : "";
    if (!orgId) {
      throw new HttpError(400, "REQ_400", "orgId is required");
    }

    stopSimulation(orgId);
    return res.json(success(req, { message: `Simulation stopped for ${orgId}` }));
  } catch (error) {
    return next(error);
  }
});