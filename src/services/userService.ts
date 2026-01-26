import { randomUUID } from "crypto";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { User, UserRole } from "../types/users.js";

interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  createdAt: Date;
}

const users = new Map<string, User>();

const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId,
  createdAt: user.createdAt
});

export const userService = {
  async createUser(email: string, password: string, role: UserRole, organizationId: string): Promise<PublicUser> {
    const id = randomUUID();
    const passwordHash = await hashPassword(password);
    const lowerEmail = email.toLowerCase();
    for (const user of users.values()) {
      if (user.email === lowerEmail) {
        throw new Error("User already exists");
      }
    }
    const user: User = {
      id,
      email: lowerEmail,
      passwordHash,
      role,
      organizationId,
      createdAt: new Date()
    };
    users.set(id, user);
    return toPublicUser(user);
  },

  async findUserByEmail(email: string): Promise<User | undefined> {
    const lower = email.toLowerCase();
    for (const user of users.values()) {
      if (user.email === lower) return user;
    }
    return undefined;
  },

  async findUserById(id: string): Promise<User | undefined> {
    return users.get(id);
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return verifyPassword(password, user.passwordHash);
  },

  toPublicUser
};
