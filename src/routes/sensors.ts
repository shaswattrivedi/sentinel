import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePolicy } from "../middleware/rbac.js";
import { success } from "../utils/response.js";

export const router = Router();

router.get("/", authenticate, requirePolicy("sensors:read"), (req, res) => {
  // TODO: list sensors scoped to building
  return res.json(success(req, { sensors: [] }));
});

router.get("/:id", authenticate, requirePolicy("sensors:read"), (req, res) => {
  // TODO: fetch sensor by id with scope checks
  return res.json(success(req, { id: req.params.id }));
});

router.post("/register", authenticate, requirePolicy("sensors:manage"), (req, res) => {
  // TODO: validate payload, register sensor
  return res.status(201).json(success(req, { registered: true }));
});

router.put("/:id/status", authenticate, requirePolicy("sensors:manage"), (req, res) => {
  // TODO: update sensor status
  return res.json(success(req, { id: req.params.id, status: "online" }));
});
