import { Router } from "express";
import { z } from "zod";
import { success } from "../utils/response.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authenticate, RequestWithUser, requireRoles } from "../middleware/auth.js";
import { authService } from "../services/authService.js";
import { userService } from "../services/userService.js";
import { UserRole } from "../types/users.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refresh_token: z.string().min(10)
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  organizationId: z.string().min(1)
});

export const router = Router();

router.post("/login", async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, "AUTH_401", "Invalid credentials"));

  try {
    const result = await authService.login(parsed.data.email, parsed.data.password);
    return res.json(
      success(req, {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        token_type: "Bearer",
        user: result.user
      })
    );
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(new HttpError(401, "AUTH_401", "Invalid credentials"));
  }
});

router.post("/refresh", async (req, res, next) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, "AUTH_401", "Invalid refresh token"));

  try {
    const result = await authService.refresh(parsed.data.refresh_token);
    return res.json(
      success(req, {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        token_type: "Bearer",
        user: result.user
      })
    );
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(new HttpError(401, "AUTH_401", "Invalid refresh token"));
  }
});

router.post("/logout", authenticate, async (req: RequestWithUser, res, next) => {
  try {
    if (req.user?.id) await authService.logout(req.user.id);
    return res.json(success(req, { message: "Logged out" }));
  } catch (error) {
    return next(new HttpError(500, "SYS_500", "Logout failed"));
  }
});

router.post("/signup", authenticate, requireRoles([UserRole.SUPER_ADMIN]), async (req, res, next) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(422, "ML_422", "Invalid signup payload"));

  try {
    const existing = await userService.findUserByEmail(parsed.data.email);
    if (existing) return next(new HttpError(409, "DATA_409", "User already exists"));
    const user = await authService.signup(parsed.data.email, parsed.data.password, parsed.data.role, parsed.data.organizationId);
    return res.status(201).json(success(req, { user }));
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(new HttpError(500, "SYS_500", "Failed to create user"));
  }
});
