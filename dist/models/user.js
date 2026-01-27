import mongoose, { Schema } from "mongoose";
import { UserRole } from "../types/users.js";
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    organizationId: { type: String, required: true }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
});
export const UserModel = mongoose.model("User", UserSchema);
