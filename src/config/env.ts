import dotenv from "dotenv";

dotenv.config();

const number = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: number(process.env.PORT, 4000),
  mongo: {
    uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017",
    dbName: process.env.MONGODB_DB ?? "sentinel"
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? "change-me",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? process.env.REFRESH_SECRET ?? "change-me-too",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? process.env.JWT_ACCESS_TTL ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? process.env.JWT_REFRESH_TTL ?? "30d",
    issuer: process.env.JWT_ISSUER ?? "sentinel",
    audience: process.env.JWT_AUDIENCE ?? "sentinel-dashboard"
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean)
  },
  rateLimit: {
    windowMs: number(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: number(process.env.RATE_LIMIT_MAX, 60)
  },
  logLevel: process.env.LOG_LEVEL ?? "info"
};
