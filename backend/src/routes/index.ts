import { Router } from "express";
import { router as auth } from "./auth.js";
import { router as users } from "./users.js";
import { router as sensors } from "./sensors.js";
import { router as risk } from "./risk.js";
import { router as evacuation } from "./evacuation.js";
import { router as alerts } from "./alerts.js";
import { router as analytics } from "./analytics.js";
import { router as admin } from "./admin.js";

export const router = Router();

router.use("/auth", auth);
router.use("/users", users);
router.use("/sensors", sensors);
router.use("/risk", risk);
router.use("/evacuation", evacuation);
router.use("/alerts", alerts);
router.use("/analytics", analytics);
router.use("/admin", admin);
