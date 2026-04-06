import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AuthTokenPayload } from "../types/auth.js";

const assertSecret = (secret: string | undefined, name: string): string => {
	if (!secret) throw new Error(`${name} is not set`);
	return secret;
};

const accessSecret = assertSecret(env.jwt.accessSecret, "JWT_ACCESS_SECRET");
const refreshSecret = assertSecret(env.jwt.refreshSecret, "JWT_REFRESH_SECRET");

export const signAccessToken = (payload: AuthTokenPayload): string => {
	const options: jwt.SignOptions = {
		expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"],
		issuer: env.jwt.issuer,
		audience: env.jwt.audience,
		jwtid: crypto.randomUUID()
	};

	return jwt.sign(
		{
			sub: payload.userId,
			role: payload.role,
			organizationId: payload.organizationId,
			email: payload.email
		},
		accessSecret,
		options
	);
};

export const signRefreshToken = (payload: AuthTokenPayload, jti: string): string => {
	const options: jwt.SignOptions = {
		expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
		issuer: env.jwt.issuer,
		audience: env.jwt.audience,
		jwtid: jti
	};

	return jwt.sign(
		{
			sub: payload.userId,
			role: payload.role,
			organizationId: payload.organizationId
		},
		refreshSecret,
		options
	);
};

export const generateJti = (): string => crypto.randomUUID();
