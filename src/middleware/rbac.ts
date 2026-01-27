import { NextFunction, Response } from "express";
import { HttpError } from "./errorHandler.js";
import { RequestWithUser } from "./auth.js";
import { UserRole } from "../types/users.js";

// Policy matrix per action.
const policy: Record<string, UserRole[]> = {
  "users:admin": [UserRole.SUPER_ADMIN],
  "sensors:read": [UserRole.SUPER_ADMIN, UserRole.BUILDING_ADMIN],
  "sensors:manage": [UserRole.SUPER_ADMIN, UserRole.BUILDING_ADMIN],
  "risk:read": [UserRole.SUPER_ADMIN, UserRole.BUILDING_ADMIN, UserRole.SAFETY_OFFICER, UserRole.VIEW_ONLY],
  "alerts:read": [UserRole.SUPER_ADMIN, UserRole.BUILDING_ADMIN, UserRole.SAFETY_OFFICER, UserRole.VIEW_ONLY],
  "alerts:ack": [UserRole.SUPER_ADMIN, UserRole.BUILDING_ADMIN, UserRole.SAFETY_OFFICER],
  "evacuation:read": [UserRole.SUPER_ADMIN, UserRole.BUILDING_ADMIN, UserRole.SAFETY_OFFICER, UserRole.VIEW_ONLY],
  "evacuation:simulate": [UserRole.SUPER_ADMIN, UserRole.BUILDING_ADMIN, UserRole.SAFETY_OFFICER]
};

export const requirePolicy = (action: keyof typeof policy) => (req: RequestWithUser, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new HttpError(401, "AUTH_401", "Authentication required"));
  const allowedRoles = policy[action];
  const ok = allowedRoles.includes(req.user.role);
  if (!ok) return next(new HttpError(403, "AUTH_403", `Unauthorized for action ${action}`));
  next();
};
