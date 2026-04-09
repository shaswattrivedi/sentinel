import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const MONGODB_DB = process.env.MONGODB_DB || "sentinel";

const AnalyticsSnapshotSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    risk_score: { type: Number, required: true },
    system_status: { type: String, enum: ["SAFE", "MODERATE", "CRITICAL"], required: true },
    zone_1: {
      cam_people_count: { type: Number, default: 0 },
      validation_score: { type: Number, default: 0 },
      zone_status: { type: String, enum: ["SAFE", "MODERATE", "CRITICAL"], default: "SAFE" }
    },
    zone_2: {
      cam_people_count: { type: Number, default: 0 },
      validation_score: { type: Number, default: 0 },
      zone_status: { type: String, enum: ["SAFE", "MODERATE", "CRITICAL"], default: "SAFE" }
    },
    trend: { type: String, enum: ["INCREASING", "STABLE", "DECREASING"], default: "STABLE" },
    alert_count: { type: Number, default: 0 }
  },
  {
    timeseries: { timeField: "timestamp", granularity: "minutes" },
    expireAfterSeconds: 60 * 60 * 24 * 30,
    versionKey: false
  }
);

const AnalyticsSnapshot = mongoose.models.AnalyticsSnapshot || mongoose.model("AnalyticsSnapshot", AnalyticsSnapshotSchema);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function noise(v: number, pct = 0.15) {
  return v * (1 + (Math.random() - 0.5) * 2 * pct);
}

function getRiskForHour(hour: number, dayMultiplier: number): number {
  const base =
    hour < 7
      ? 10
      : hour < 9
        ? 30
        : hour < 12
          ? 55
          : hour < 14
            ? 35
            : hour < 17
              ? 48
              : hour < 20
                ? 75
                : hour < 22
                  ? 40
                  : 15;
  return clamp(noise(base * dayMultiplier), 0, 100);
}

function getPeopleForRisk(risk: number): number {
  return clamp(Math.round(noise(risk / 4.5)), 0, 30);
}

function getStatus(risk: number): "SAFE" | "MODERATE" | "CRITICAL" {
  return risk < 41 ? "SAFE" : risk < 76 ? "MODERATE" : "CRITICAL";
}

function getTrend(prev: number, curr: number): "INCREASING" | "STABLE" | "DECREASING" {
  const delta = curr - prev;
  return delta > 8 ? "INCREASING" : delta < -8 ? "DECREASING" : "STABLE";
}

async function seed() {
  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB,
    serverSelectionTimeoutMS: 10000
  });
  await AnalyticsSnapshot.deleteMany({});

  const dayMultipliers = [1.1, 0.9, 0.85, 1.0, 1.15, 1.2, 0.95];
  const docs = [];
  const now = new Date();
  let prevRisk = 10;

  for (let d = 6; d >= 0; d -= 1) {
    const dayMult = dayMultipliers[6 - d];
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);

    for (let h = 0; h < 24; h += 1) {
      for (let m = 0; m < 60; m += 5) {
        const ts = new Date(date);
        ts.setHours(h, m, 0, 0);

        const risk = getRiskForHour(h, dayMult);
        const z1People = getPeopleForRisk(risk * 0.9);
        const z2People = getPeopleForRisk(risk * 1.1);
        const z1Val = clamp(noise(risk * 0.85), 0, 100);
        const z2Val = clamp(noise(risk * 0.95), 0, 100);
        const alerts = getStatus(risk) === "CRITICAL" ? Math.floor(Math.random() * 4) + 1 : 0;

        docs.push({
          timestamp: ts,
          risk_score: Math.round(risk),
          system_status: getStatus(risk),
          zone_1: {
            cam_people_count: z1People,
            validation_score: Math.round(z1Val),
            zone_status: getStatus(z1Val)
          },
          zone_2: {
            cam_people_count: z2People,
            validation_score: Math.round(z2Val),
            zone_status: getStatus(z2Val)
          },
          trend: getTrend(prevRisk, risk),
          alert_count: alerts
        });

        prevRisk = risk;
      }
    }
  }

  await AnalyticsSnapshot.insertMany(docs);
  console.log(`[Seed] Inserted ${docs.length} snapshots across 7 days`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(`[Seed] Failed to insert analytics snapshots (${MONGODB_URI}, db=${MONGODB_DB})`, error);
  process.exit(1);
});