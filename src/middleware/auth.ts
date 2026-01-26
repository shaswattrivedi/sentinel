import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "./errorHandler.js";
import { AuthenticatedUser, Role } from "../types/auth.js";
import { userService } from "../services/userService.js";

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
  requestId?: string;
}

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.access_token;
  return cookieToken ?? null;
};

export const authenticate = (req: RequestWithUser, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return next(new HttpError(401, "AUTH_401", "Authentication required"));
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret, {
      audience: env.jwt.audience,
      issuer: env.jwt.issuer
    }) as jwt.JwtPayload;

    const userId = (payload.sub as string) ?? (payload as { userId?: string }).userId;
    if (!userId) return next(new HttpError(401, "AUTH_401", "Invalid token"));

    userService
      .findUserById(userId)
      .then((user) => {
        if (!user) return next(new HttpError(401, "AUTH_401", "Invalid token"));
        // Optional: ensure role consistency between token and current user record
        if ((payload as { role?: Role }).role && user.role !== (payload as { role?: Role }).role) {
          return next(new HttpError(401, "AUTH_401", "Invalid token"));
        }

        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        };

        next();
      })
      .catch(() => next(new HttpError(401, "AUTH_401", "Invalid token")));
  } catch (error) {
    return next(new HttpError(401, "AUTH_401", "Invalid or expired token"));
  }
};

export const requireRoles = (allowedRoles: Role[]) => (req: RequestWithUser, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new HttpError(401, "AUTH_401", "Authentication required"));
  const hasRole = allowedRoles.includes(req.user.role);
  if (!hasRole) return next(new HttpError(403, "AUTH_403", "Unauthorized access"));
  next();
};
