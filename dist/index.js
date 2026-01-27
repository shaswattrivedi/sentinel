import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { requestContext } from "./middleware/requestContext.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { router as apiRouter } from "./routes/index.js";
const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: env.cors.allowedOrigins.length ? env.cors.allowedOrigins : undefined,
    credentials: true
}));
app.use(morgan("combined"));
app.use(requestContext);
app.get("/", (_req, res) => {
    res.json({ status: "ok", service: "sentinel-api", version: "v1", uptime: process.uptime() });
});
app.use("/api/v1", rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false
}), apiRouter);
const docsPath = path.join(process.cwd(), "docs");
app.get("/docs/openapi.yaml", (_req, res) => res.sendFile(path.join(docsPath, "openapi.yaml")));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerUrl: "/docs/openapi.yaml",
    explorer: true
}));
app.use(errorHandler);
const start = async () => {
    await connectDb();
    app.listen(env.port, () => {
        console.log(`SENTINEL API listening on port ${env.port}`);
    });
};
start().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
});
