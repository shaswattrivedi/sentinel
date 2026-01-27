import mongoose, { Schema } from "mongoose";
import { UserRole } from "../types/users.js";

export interface UserDoc {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: string;
  createdAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    organizationId: { type: String, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

export const UserModel = mongoose.model<UserDoc>("User", UserSchema);
