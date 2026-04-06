import { hashPassword, verifyPassword } from "../utils/password.js";
import { UserRole } from "../types/users.js";
import { UserModel, UserDoc } from "../models/user.js";

interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  createdAt: Date;
}

type UserRecord = PublicUser & { passwordHash: string };

const toRecord = (user: UserDoc | (UserDoc & { _id: string }) | null): UserRecord | undefined => {
  if (!user) return undefined;
  const id = (user as UserDoc & { id?: string }).id ?? (user as { _id?: unknown })._id?.toString();
  return {
    id: id ?? "",
    email: user.email,
    passwordHash: (user as UserDoc).passwordHash,
    role: user.role,
    organizationId: user.organizationId,
    createdAt: user.createdAt
  };
};

const toPublicUser = (user: UserRecord): PublicUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId,
  createdAt: user.createdAt
});

export const userService = {
  async createUser(email: string, password: string, role: UserRole, organizationId: string): Promise<PublicUser> {
    const lowerEmail = email.toLowerCase();
    const passwordHash = await hashPassword(password);
    try {
      const user = await UserModel.create({ email: lowerEmail, passwordHash, role, organizationId });
      const record = toRecord(user);
      if (!record) throw new Error("Failed to create user");
      return toPublicUser(record);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new Error("User already exists");
      }
      throw error;
    }
  },

  async findUserByEmail(email: string): Promise<UserRecord | undefined> {
    const lower = email.toLowerCase();
    const doc = await UserModel.findOne({ email: lower }).lean();
    return toRecord(doc as UserDoc | null);
  },

  async findUserById(id: string): Promise<UserRecord | undefined> {
    const doc = await UserModel.findById(id).lean();
    return toRecord(doc as UserDoc | null);
  },

  async verifyPassword(user: UserRecord, password: string): Promise<boolean> {
    return verifyPassword(password, user.passwordHash);
  },

  toPublicUser
};
