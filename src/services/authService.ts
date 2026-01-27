import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errorHandler.js";
import { AuthTokenPayload } from "../types/auth.js";
import { UserRole } from "../types/users.js";
import { userService } from "./userService.js";
import { generateJti, signAccessToken, signRefreshToken } from "../utils/jwt.js";

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
    createdAt: Date;
  };
}

type RefreshRecord = { userId: string; revoked: boolean };

const refreshStore = new Map<string, RefreshRecord>();
const userIndex = new Map<string, Set<string>>();

const issueTokens = (user: {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
}) => {
  const payload: AuthTokenPayload = {
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId,
    email: user.email
  };

  const accessToken = signAccessToken(payload);
  const jti = generateJti();
  const refreshToken = signRefreshToken(payload, jti);
  registerRefresh(jti, user.id);

  return { accessToken, refreshToken };
};

const registerRefresh = (jti: string, userId: string) => {
  refreshStore.set(jti, { userId, revoked: false });
  if (!userIndex.has(userId)) userIndex.set(userId, new Set());
  userIndex.get(userId)?.add(jti);
};

const revokeJti = (jti: string) => {
  const record = refreshStore.get(jti);
  if (record) {
    record.revoked = true;
    refreshStore.set(jti, record);
  }
};

const revokeAllForUser = (userId: string) => {
  const set = userIndex.get(userId);
  if (!set) return;
  for (const jti of set) {
    const rec = refreshStore.get(jti);
    if (rec) {
      rec.revoked = true;
      refreshStore.set(jti, rec);
    }
  }
  userIndex.delete(userId);
};

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await userService.findUserByEmail(email);
    if (!user) throw new HttpError(401, "AUTH_401", "Invalid credentials");

    let valid = false;
    try {
      valid = await userService.verifyPassword(user, password);
    } catch (error) {
      throw new HttpError(500, "AUTH_500", "Password verification failed");
    }
    if (!valid) throw new HttpError(401, "AUTH_401", "Invalid credentials");

    const { accessToken, refreshToken } = issueTokens(user);
    return {
      accessToken,
      refreshToken,
      user: userService.toPublicUser(user)
    };
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret, {
        issuer: env.jwt.issuer,
        audience: env.jwt.audience
      }) as jwt.JwtPayload;

      const userId = (decoded.sub as string) ?? (decoded as { userId?: string }).userId;
      const jti = (decoded as { jti?: string }).jti;
      if (!userId || !jti) throw new HttpError(401, "AUTH_401", "Invalid refresh token");

      const record = refreshStore.get(jti);
      if (!record || record.revoked || record.userId !== userId) {
        throw new HttpError(401, "AUTH_401", "Invalid refresh token");
      }

      const user = await userService.findUserById(userId);
      if (!user) throw new HttpError(401, "AUTH_401", "Invalid refresh token");
      const { accessToken: newAccess, refreshToken: newRefresh } = issueTokens(user);

      // rotate: revoke old, register new
      revokeJti(jti);
      // new refresh already registered inside issueTokens; ensure old user index cleanup
      // Add previous jti to index cleanup guard
      const set = userIndex.get(user.id) ?? new Set<string>();
      set.add(jti);
      userIndex.set(user.id, set);

      return {
        accessToken: newAccess,
        refreshToken: newRefresh,
        user: userService.toPublicUser(user)
      };
    } catch (error) {
      throw new HttpError(401, "AUTH_401", "Invalid refresh token");
    }
  },

  async logout(userId: string): Promise<void> {
    revokeAllForUser(userId);
  },

  async signup(email: string, password: string, role: UserRole, organizationId: string) {
    try {
      const user = await userService.createUser(email, password, role, organizationId);
      return user;
    } catch (error) {
      if (error instanceof Error && error.message.includes("exists")) {
        throw new HttpError(409, "DATA_409", "User already exists");
      }
      throw new HttpError(500, "SYS_500", "Failed to create user");
    }
  },

  async signupSelf(email: string, password: string, organizationId: string): Promise<AuthResult> {
    try {
      const user = await userService.createUser(email, password, UserRole.VIEW_ONLY, organizationId);
      const { accessToken, refreshToken } = issueTokens(user);
      return {
        accessToken,
        refreshToken,
        user
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("exists")) {
        throw new HttpError(409, "DATA_409", "User already exists");
      }
      throw new HttpError(500, "SYS_500", "Failed to create user");
    }
  }
};
