export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  BUILDING_ADMIN = "BUILDING_ADMIN",
  SAFETY_OFFICER = "SAFETY_OFFICER",
  VIEW_ONLY = "VIEW_ONLY",
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: string;
  createdAt: Date;
}
