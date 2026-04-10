import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const MONGODB_DB = process.env.MONGODB_DB || "sentinel";

const AnalyticsSnapshotSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    dataSource: { type: String, enum: ["seed", "live"], required: true, default: "live" },
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

const AnalyticsSnapshot =
  mongoose.models.AnalyticsSnapshot || mongoose.model("AnalyticsSnapshot", AnalyticsSnapshotSchema);

const MINUTE_MS = 60 * 1000;
const FIVE_MIN_MS = 5 * MINUTE_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;
const WEEK_MS = 7 * DAY_MS;
const RETENTION_DAYS = 120;

const WEEK_TYPES = ["A", "A", "C", "A", "A", "B", "A", "D", "A", "A", "C", "B", "E"] as const;

const DOW_MULTIPLIERS: Record<number, number> = {
  0: 1.1,
  1: 0.85,
  2: 0.9,
  3: 0.8,
  4: 0.95,
  5: 1.2,
  6: 1.3
};

function getBaseRiskForHour(hour: number): number {
  if (hour < 6) return 8;
  if (hour < 9) return 15 + (hour - 6) * 13;
  if (hour < 12) return 55 + Math.random() * 15;
  if (hour < 14) return 35 + Math.random() * 10;
  if (hour < 17) return 45 + Math.random() * 20;
  if (hour < 20) return 65 + Math.random() * 30;
  if (hour < 22) return 40 + Math.random() * 20;
  return 12 + Math.random() * 10;
}

function getWeekMultiplier(weekIndex: number, hour: number, dayOfWeek: number): number {
  const type = WEEK_TYPES[weekIndex % WEEK_TYPES.length];
  switch (type) {
    case "A":
      return 1.0;
    case "B":
      return hour >= 15 && hour < 19 ? 1.5 : 1.2;
    case "C":
      return 0.6;
    case "D":
      return 1.0;
    case "E":
      return 0.7 + (dayOfWeek === 0 ? 6 : dayOfWeek) * 0.1;
    default:
      return 1.0;
  }
}

function getZone1Multiplier(hour: number): number {
  return hour >= 8 && hour < 13 ? 1.15 : 0.9;
}

function getZone2Multiplier(hour: number): number {
  return hour >= 16 && hour < 21 ? 1.2 : 0.85;
}

function getAlertCount(
  status: "SAFE" | "MODERATE" | "CRITICAL",
  weekType: string,
  hour: number
): number {
  let base = 0;

  if (status === "MODERATE") {
    base = Math.random() < 0.4 ? 1 : Math.random() < 0.3 ? 2 : 0;
  } else if (status === "CRITICAL") {
    base = 2 + Math.floor(Math.random() * 4);
  }

  if (hour >= 17 && hour < 20 && status !== "SAFE") {
    base += 1;
  }

  if (weekType === "B" || weekType === "D") {
    base += status !== "SAFE" ? 2 : 0;
  }

  return base;
}

function toUtcDayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

async function seed() {
  // Load env
  const rawMongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
  const mongoDbName = process.env.MONGODB_DB ?? 'sentinel';

  let mongoUri = rawMongoUri;
  try {
    const parsed = new URL(rawMongoUri);
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = `/${mongoDbName}`;
    }
    mongoUri = parsed.toString();
  } catch {
    mongoUri = rawMongoUri.endsWith('/') ? `${rawMongoUri}${mongoDbName}` : `${rawMongoUri}/${mongoDbName}`;
  }

  await mongoose.connect(mongoUri);
  console.log('[Seed] Connected to MongoDB');

  let orgIds = (process.env.SEED_ORG_IDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);

  if (orgIds.length === 0) {
    const db = mongoose.connection.db;
    const discovered = db
      ? await db.collection('users').distinct('organizationId')
      : [];

    orgIds = discovered
      .filter((value): value is string => typeof value === 'string')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (orgIds.length === 0) {
    orgIds = ['org_1', 'org_2'];
  }

  console.log(`[Seed] Target organizations: ${orgIds.join(', ')}`);

  const force = process.argv.includes('--force');

  // ── Compute date boundaries in pure UTC milliseconds ──────────────
  // Keep a rolling 90-day window including today up to the latest 5-minute bucket.
  const nowMs = Date.now();
  const todayStartMs = nowMs - (nowMs % (24 * 60 * 60 * 1000));
  const endMs = nowMs - (nowMs % FIVE_MIN_MS);
  const startMs = todayStartMs - (90 - 1) * 24 * 60 * 60 * 1000;

  console.log('[Seed] Date range:');
  console.log('  Start:', new Date(startMs).toISOString());
  console.log('  End:  ', new Date(endMs).toISOString());

  // ── Idempotency check ──────────────────────────────────────────────
  const existingCount = await AnalyticsSnapshot.countDocuments({
    organizationId: { $in: orgIds },
    dataSource: 'seed',
  });

  if (existingCount > 0 && !force) {
    console.log(`[Seed] ${existingCount} seed records already exist. Skipping.`);
    console.log('[Seed] Run with --force to replace seed data.');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (force && existingCount > 0) {
    const del = await AnalyticsSnapshot.deleteMany({
      organizationId: { $in: orgIds },
      dataSource: 'seed',
    });
    console.log(`[Seed] Deleted ${del.deletedCount} seed records. Live data untouched.`);
  }

  // ── Week archetypes ────────────────────────────────────────────────
  const WEEK_TYPES = ['A','A','C','A','A','B','A','D','A','A','C','B','E'];

  // Pre-pick incident day for each type-D week (0-6)
  const incidentDayPerWeek = new Map<number, number>();
  WEEK_TYPES.forEach((t, i) => {
    if (t === 'D') incidentDayPerWeek.set(i, Math.floor(Math.random() * 7));
  });

  // ── Helper functions ───────────────────────────────────────────────
  function baseRiskForHour(h: number): number {
    if (h < 6)  return 8;
    if (h < 9)  return 15 + (h - 6) * 13;
    if (h < 12) return 55 + Math.random() * 15;
    if (h < 14) return 35 + Math.random() * 10;
    if (h < 17) return 45 + Math.random() * 20;
    if (h < 20) return 65 + Math.random() * 30;
    if (h < 22) return 40 + Math.random() * 20;
    return 12 + Math.random() * 10;
  }

  const DOW_MULT: Record<number, number> = {
    0: 1.10, 1: 0.85, 2: 0.90, 3: 0.80, 4: 0.95, 5: 1.20, 6: 1.30,
  };

  function weekMult(weekType: string, h: number): number {
    switch (weekType) {
      case 'B': return (h >= 15 && h < 19) ? 1.5 : 1.2;
      case 'C': return 0.60;
      case 'E': return 0.85; // handled by gradual dow logic
      default:  return 1.0;
    }
  }

  function alertCount(
    status: 'SAFE' | 'MODERATE' | 'CRITICAL',
    weekType: string,
    h: number
  ): number {
    let base = 0;
    if (status === 'MODERATE') {
      base = Math.random() < 0.4 ? 1 : Math.random() < 0.3 ? 2 : 0;
    } else if (status === 'CRITICAL') {
      base = 2 + Math.floor(Math.random() * 4);
    }
    if (h >= 17 && h < 20 && status !== 'SAFE') base += 1;
    if ((weekType === 'B' || weekType === 'D') && status !== 'SAFE') base += 2;
    return base;
  }

  // ── Generation loop ────────────────────────────────────────────────
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  const WEEK_MS     = 7 * 24 * 60 * 60 * 1000;
  const docs: any[] = [];
  let noiseDrift = 0;
  let prevRisk   = 10;

  for (let curMs = startMs; curMs <= endMs; curMs += INTERVAL_MS) {
    // UTC time components — NO local timezone involvement
    const d       = new Date(curMs);
    const h       = d.getUTCHours();
    const dow     = d.getUTCDay();
    const weekIdx = Math.floor((curMs - startMs) / WEEK_MS);
    const weekType = WEEK_TYPES[weekIdx % WEEK_TYPES.length] ?? 'A';

    // Smooth noise drift
    noiseDrift += (Math.random() - 0.5) * 0.08;
    noiseDrift  = Math.max(-0.20, Math.min(0.20, noiseDrift));

    // Base risk
    let risk = baseRiskForHour(h);
    risk *= DOW_MULT[dow] ?? 1.0;
    risk *= weekMult(weekType, h);

    // Incident spike for type-D weeks
    if (weekType === 'D') {
      const incDay = incidentDayPerWeek.get(weekIdx % WEEK_TYPES.length) ?? 0;
      const weekStartMs = startMs + weekIdx * WEEK_MS;
      const incidentMs  = weekStartMs + incDay * 24 * 60 * 60 * 1000;
      const sameDay = Math.floor(curMs / (24 * 60 * 60 * 1000)) ===
                      Math.floor(incidentMs / (24 * 60 * 60 * 1000));
      if (sameDay && h >= 10 && h < 13) risk *= 2.5;
    }

    risk = Math.max(0, Math.min(100, risk * (1 + noiseDrift)));

    const status: 'SAFE' | 'MODERATE' | 'CRITICAL' =
      risk < 41 ? 'SAFE' : risk < 76 ? 'MODERATE' : 'CRITICAL';

    const trend: 'INCREASING' | 'STABLE' | 'DECREASING' =
      risk - prevRisk > 8 ? 'INCREASING' :
      risk - prevRisk < -8 ? 'DECREASING' : 'STABLE';
    prevRisk = risk;

    const z1Mult = (h >= 8  && h < 13) ? 1.15 : 0.90;
    const z2Mult = (h >= 16 && h < 21) ? 1.20 : 0.85;
    const z1p = Math.max(0, Math.round((risk / 5) * z1Mult * (1 + (Math.random()-0.5)*0.2)));
    const z2p = Math.max(0, Math.round((risk / 4.5) * z2Mult * (1 + (Math.random()-0.5)*0.2)));
    const z1v = Math.max(0, Math.min(100, risk * 0.85 * (1 + (Math.random()-0.5)*0.3)));
    const z2v = Math.max(0, Math.min(100, risk * 1.05 * (1 + (Math.random()-0.5)*0.3)));
    const alerts = alertCount(status, weekType, h);

    for (let oi = 0; oi < orgIds.length; oi++) {
      const om = 1 + oi * 0.1;
      const or = Math.round(Math.min(100, risk * om));
      const os: 'SAFE' | 'MODERATE' | 'CRITICAL' =
        or < 41 ? 'SAFE' : or < 76 ? 'MODERATE' : 'CRITICAL';
      docs.push({
        dataSource: 'seed',
        organizationId: orgIds[oi],
        timestamp: new Date(curMs),
        risk_score: or,
        system_status: os,
        zone_1: {
          cam_people_count: z1p,
          validation_score: Math.round(z1v),
          zone_status: z1v < 41 ? 'SAFE' : z1v < 76 ? 'MODERATE' : 'CRITICAL',
        },
        zone_2: {
          cam_people_count: z2p,
          validation_score: Math.round(z2v),
          zone_status: z2v < 41 ? 'SAFE' : z2v < 76 ? 'MODERATE' : 'CRITICAL',
        },
        trend,
        alert_count: alerts,
      });
    }
  }

  // ── Batched insert ─────────────────────────────────────────────────
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    await AnalyticsSnapshot.insertMany(docs.slice(i, i + BATCH));
    inserted += Math.min(BATCH, docs.length - i);
    process.stdout.write(`\r[Seed] ${inserted}/${docs.length} records inserted`);
  }

  // ── Verification ───────────────────────────────────────────────────
  const seedCount = await AnalyticsSnapshot.countDocuments({
    dataSource: 'seed',
    organizationId: { $in: orgIds },
  });
  const liveCount = await AnalyticsSnapshot.countDocuments({
    dataSource: 'live',
    organizationId: { $in: orgIds },
  });
  console.log(`\n[Seed] Done.`);
  console.log(`[Seed] Seed records: ${seedCount}`);
  console.log(`[Seed] Live records: ${liveCount} (untouched)`);
  console.log(`[Seed] First record: ${new Date(startMs).toISOString()}`);
  console.log(`[Seed] Last record:  ${new Date(endMs).toISOString()}`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(`[Seed] Failed to insert analytics snapshots (${MONGODB_URI}, db=${MONGODB_DB})`, error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors while handling fatal seed failure
  }
  process.exit(1);
});
