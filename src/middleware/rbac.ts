import { NextFunction, Response } from "express";
import { HttpError } from "./errorHandler.js";
import { RequestWithUser } from "./auth.js";
import { Role } from "../types/auth.js";

// Policy matrix per action.
const policy: Record<string, Role[]> = {
  "users:admin": ["SUPER_ADMIN"],
  "sensors:read": ["SUPER_ADMIN", "BUILDING_ADMIN"],
  "sensors:manage": ["SUPER_ADMIN", "BUILDING_ADMIN"],
  "risk:read": ["SUPER_ADMIN", "BUILDING_ADMIN", "SAFETY_OFFICER", "VIEW_ONLY"],
  "alerts:read": ["SUPER_ADMIN", "BUILDING_ADMIN", "SAFETY_OFFICER", "VIEW_ONLY"],
  "alerts:ack": ["SUPER_ADMIN", "BUILDING_ADMIN", "SAFETY_OFFICER"],
  "evacuation:read": ["SUPER_ADMIN", "BUILDING_ADMIN", "SAFETY_OFFICER", "VIEW_ONLY"],
  "evacuation:simulate": ["SUPER_ADMIN", "BUILDING_ADMIN", "SAFETY_OFFICER"]
};

export const requirePolicy = (action: keyof typeof policy) => (req: RequestWithUser, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new HttpError(401, "AUTH_401", "Authentication required"));
  const allowedRoles = policy[action];
  const ok = allowedRoles.includes(req.user.role);
  if (!ok) return next(new HttpError(403, "AUTH_403", `Unauthorized for action ${action}`));
  next();
};
