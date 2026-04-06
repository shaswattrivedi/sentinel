import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePolicy } from "../middleware/rbac.js";
import { success } from "../utils/response.js";

export const router = Router();

router.get("/routes", authenticate, requirePolicy("evacuation:read"), (req, res) => {
  return res.json(success(req, { routes: [] }));
});

router.post("/simulate", authenticate, requirePolicy("evacuation:simulate"), (req, res) => {
  return res.status(202).json(success(req, { simulation_id: "sim-1", status: "queued" }));
});

router.get("/recommendation", authenticate, requirePolicy("evacuation:read"), (req, res) => {
  return res.json(success(req, { recommendation: [] }));
});
