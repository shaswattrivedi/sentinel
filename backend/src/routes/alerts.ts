import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePolicy } from "../middleware/rbac.js";
import { success } from "../utils/response.js";
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

router.get("/", authenticate, requirePolicy("alerts:read"), (req: RequestWithUser, res, next) => {
  try {
    const organizationId = getOrganizationId(req);
    const alerts = alertService.list(organizationId);
    return res.json(success(req, { alerts }));
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/acknowledge", authenticate, requirePolicy("alerts:ack"), (req: RequestWithUser, res, next) => {
  try {
    const organizationId = getOrganizationId(req);
    const alert = alertService.acknowledge(req.params.id, organizationId);
    return res.json(success(req, { alert }));
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(new HttpError(500, "SYS_500", "Failed to acknowledge alert"));
  }
});
