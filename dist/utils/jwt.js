import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
const assertSecret = (secret, name) => {
    if (!secret)
        throw new Error(`${name} is not set`);
    return secret;
};
const accessSecret = assertSecret(env.jwt.accessSecret, "JWT_ACCESS_SECRET");
const refreshSecret = assertSecret(env.jwt.refreshSecret, "JWT_REFRESH_SECRET");
export const signAccessToken = (payload) => {
    const options = {
        expiresIn: env.jwt.accessExpiresIn,
        issuer: env.jwt.issuer,
        audience: env.jwt.audience,
        jwtid: crypto.randomUUID()
    };
    return jwt.sign({
        sub: payload.userId,
        role: payload.role,
        organizationId: payload.organizationId,
        email: payload.email
    }, accessSecret, options);
};
export const signRefreshToken = (payload, jti) => {
    const options = {
        expiresIn: env.jwt.refreshExpiresIn,
        issuer: env.jwt.issuer,
        audience: env.jwt.audience,
        jwtid: jti
    };
    return jwt.sign({
        sub: payload.userId,
        role: payload.role,
        organizationId: payload.organizationId
    }, refreshSecret, options);
};
export const generateJti = () => crypto.randomUUID();
