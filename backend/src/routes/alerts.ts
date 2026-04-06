import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePolicy } from "../middleware/rbac.js";
import { success } from "../utils/response.js";
import { alertService } from "../services/alertService.js";
import { HttpError } from "../middleware/errorHandler.js";

export const router = Router();

router.get("/", authenticate, requirePolicy("alerts:read"), (req, res) => {
  const alerts = alertService.list();
  return res.json(success(req, { alerts }));
});

router.post("/:id/acknowledge", authenticate, requirePolicy("alerts:ack"), (req, res, next) => {
  try {
    const alert = alertService.acknowledge(req.params.id);
    return res.json(success(req, { alert }));
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(new HttpError(500, "SYS_500", "Failed to acknowledge alert"));
  }
});
