import { Router } from "express";
import { authenticate, RequestWithUser } from "../middleware/auth.js";
import { requirePolicy } from "../middleware/rbac.js";
import { success } from "../utils/response.js";


export const router = Router();

router.get("/me", authenticate, (req: RequestWithUser, res) => {
  return res.json(
    success(req, {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      organizationId: req.user?.organizationId
    })
  );
});

router.get("/:id", authenticate, requirePolicy("users:admin"), (req: RequestWithUser, res) => {
  // TODO: fetch from user service with scope checks
  return res.json(success(req, { id: req.params.id }));
});

router.put("/:id", authenticate, requirePolicy("users:admin"), (req: RequestWithUser, res) => {
  // TODO: update user with payload validation and audit logging
  return res.json(success(req, { id: req.params.id, updated: true }));
});

router.get("/:id/roles", authenticate, requirePolicy("users:admin"), (req: RequestWithUser, res) => {
  // TODO: fetch roles from directory or DB
  return res.json(success(req, { id: req.params.id, role: "VIEW_ONLY" }));
});
