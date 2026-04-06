import { UserRole } from "./users.js";

export type Role = UserRole;

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  organizationId: string;
  email?: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
  organizationId: string;
}
