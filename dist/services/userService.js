import { hashPassword, verifyPassword } from "../utils/password.js";
import { UserModel } from "../models/user.js";
const toRecord = (user) => {
    if (!user)
        return undefined;
    const id = user.id ?? user._id?.toString();
    return {
        id: id ?? "",
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        organizationId: user.organizationId,
        createdAt: user.createdAt
    };
};
const toPublicUser = (user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    createdAt: user.createdAt
});
export const userService = {
    async createUser(email, password, role, organizationId) {
        const lowerEmail = email.toLowerCase();
        const passwordHash = await hashPassword(password);
        try {
            const user = await UserModel.create({ email: lowerEmail, passwordHash, role, organizationId });
            const record = toRecord(user);
            if (!record)
                throw new Error("Failed to create user");
            return toPublicUser(record);
        }
        catch (error) {
            if (error?.code === 11000) {
                throw new Error("User already exists");
            }
            throw error;
        }
    },
    async findUserByEmail(email) {
        const lower = email.toLowerCase();
        const doc = await UserModel.findOne({ email: lower }).lean();
        return toRecord(doc);
    },
    async findUserById(id) {
        const doc = await UserModel.findById(id).lean();
        return toRecord(doc);
    },
    async verifyPassword(user, password) {
        return verifyPassword(password, user.passwordHash);
    },
    toPublicUser
};
