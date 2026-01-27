import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "./errorHandler.js";
import { userService } from "../services/userService.js";
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer "))
        return authHeader.substring(7);
    const cookieToken = req.cookies?.access_token;
    return cookieToken ?? null;
};
export const authenticate = (req, _res, next) => {
    const token = extractToken(req);
    if (!token) {
        return next(new HttpError(401, "AUTH_401", "Authentication required"));
    }
    try {
        const payload = jwt.verify(token, env.jwt.accessSecret, {
            audience: env.jwt.audience,
            issuer: env.jwt.issuer
        });
        const userId = payload.sub ?? payload.userId;
        if (!userId)
            return next(new HttpError(401, "AUTH_401", "Invalid token"));
        userService
            .findUserById(userId)
            .then((user) => {
            if (!user)
                return next(new HttpError(401, "AUTH_401", "Invalid token"));
            // Optional: ensure role consistency between token and current user record
            if (payload.role && user.role !== payload.role) {
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
    }
    catch (error) {
        return next(new HttpError(401, "AUTH_401", "Invalid or expired token"));
    }
};
export const requireRoles = (allowedRoles) => (req, _res, next) => {
    if (!req.user)
        return next(new HttpError(401, "AUTH_401", "Authentication required"));
    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole)
        return next(new HttpError(403, "AUTH_403", "Unauthorized access"));
    next();
};
