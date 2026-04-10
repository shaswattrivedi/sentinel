import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { AnalyticsSnapshot } from "../models/analyticsSnapshot.js";
import type { TrendStatus, ZoneStatus } from "../models/analyticsSnapshot.js";
import type { RequestWithUser } from "../middleware/auth.js";

type FilterType = "daily" | "weekly" | "monthly";

type SnapshotPoint = {
  label: string;
  timestamp: string;
  risk_score: number;
  system_status: ZoneStatus;
  zone_1_people: number;
  zone_2_people: number;
  zone_1_validation: number;
  zone_2_validation: number;
  alert_count: number;
  trend: TrendStatus;
};

type SnapshotSummary = {
  avg_risk_score: number;
  peak_risk_score: number;
  peak_time: string | null;
  total_alerts: number;
  dominant_status: ZoneStatus;
  dominant_trend: TrendStatus;
};

type LeanSnapshot = {
  timestamp: Date;
  risk_score: number;
  system_status: ZoneStatus;
  zone_1?: {
    cam_people_count?: number;
    validation_score?: number;
    zone_status?: ZoneStatus;
  };
  zone_2?: {
    cam_people_count?: number;
    validation_score?: number;
    zone_status?: ZoneStatus;
  };
  trend?: TrendStatus;
  alert_count?: number;
};

type BucketStats = {
  timestamp: Date;
  label: string;
  snapshots: LeanSnapshot[];
};

export const router = Router();

const DAY_MS = 24 * 60 * 60 * 1000;

const isFilterType = (value: string): value is FilterType => value === "daily" || value === "weekly" || value === "monthly";

const toUtcDayStart = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

const parseDate = (input: unknown): Date => {
  if (typeof input !== "string" || !input.trim()) return new Date();
  const parsed = new Date(input);
  if (!Number.isFinite(parsed.getTime())) throw new HttpError(400, "REQ_400", "Invalid date query parameter");
  return parsed;
};

const parseFilter = (input: unknown): FilterType => {
  if (typeof input !== "string" || !input.trim()) return "daily";
  const lowered = input.toLowerCase();
  if (!isFilterType(lowered)) throw new HttpError(400, "REQ_400", "Invalid filter query parameter");
  return lowered;
};

const avg = (values: number[]): number => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

const mode = <T extends string>(values: T[], fallback: T): T => {
  if (!values.length) return fallback;
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  let winner = fallback;
  let winnerCount = -1;
  counts.forEach((count, value) => {
    if (count > winnerCount) {
      winner = value;
      winnerCount = count;
    }
  });
  return winner;
};

const labelForBucket = (filter: FilterType, timestamp: Date): string => {
  if (filter === "daily") {
    const hh = String(timestamp.getUTCHours()).padStart(2, "0");
    return `${hh}:00`;
  }

  if (filter === "weekly") {
    return timestamp.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  }

  return timestamp.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
};

const bucketStart = (filter: FilterType, timestamp: Date): Date => {
  if (filter === "daily") {
    return new Date(
      Date.UTC(timestamp.getUTCFullYear(), timestamp.getUTCMonth(), timestamp.getUTCDate(), timestamp.getUTCHours(), 0, 0, 0)
    );
  }
  return toUtcDayStart(timestamp);
};

const getRange = (filter: FilterType, date: Date): { start: Date; end: Date } => {
  const end = new Date(toUtcDayStart(date).getTime() + DAY_MS);
  const spanDays = filter === "daily" ? 1 : filter === "weekly" ? 7 : 30;
  const start = new Date(end.getTime() - spanDays * DAY_MS);
  return { start, end };
};

const buildPoints = (filter: FilterType, docs: LeanSnapshot[]): SnapshotPoint[] => {
  const buckets = new Map<string, BucketStats>();

  docs.forEach((doc) => {
    const ts = new Date(doc.timestamp);
    const start = bucketStart(filter, ts);
    const key = start.toISOString();
    const existing = buckets.get(key);

    if (existing) {
      existing.snapshots.push(doc);
      return;
    }

    buckets.set(key, {
      timestamp: start,
      label: labelForBucket(filter, start),
      snapshots: [doc]
    });
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((bucket): SnapshotPoint => {
      const risks = bucket.snapshots.map((s) => s.risk_score ?? 0);
      const z1People = bucket.snapshots.map((s) => s.zone_1?.cam_people_count ?? 0);
      const z2People = bucket.snapshots.map((s) => s.zone_2?.cam_people_count ?? 0);
      const z1Validation = bucket.snapshots.map((s) => s.zone_1?.validation_score ?? 0);
      const z2Validation = bucket.snapshots.map((s) => s.zone_2?.validation_score ?? 0);
      const alerts = bucket.snapshots.map((s) => s.alert_count ?? 0);
      const statuses = bucket.snapshots.map((s) => s.system_status ?? "SAFE");
      const trends = bucket.snapshots.map((s) => s.trend ?? "STABLE");

      return {
        label: bucket.label,
        timestamp: bucket.timestamp.toISOString(),
        risk_score: Math.round(avg(risks)),
        system_status: mode(statuses, "SAFE"),
        zone_1_people: Math.round(avg(z1People)),
        zone_2_people: Math.round(avg(z2People)),
        zone_1_validation: Math.round(avg(z1Validation)),
        zone_2_validation: Math.round(avg(z2Validation)),
        alert_count: sum(alerts),
        trend: mode(trends, "STABLE")
      };
    });
};

const buildSummary = (data: SnapshotPoint[]): SnapshotSummary => {
  if (!data.length) {
    return {
      avg_risk_score: 0,
      peak_risk_score: 0,
      peak_time: null,
      total_alerts: 0,
      dominant_status: "SAFE",
      dominant_trend: "STABLE"
    };
  }

  const peak = data.reduce((max, point) => (point.risk_score > max.risk_score ? point : max), data[0]);

  return {
    avg_risk_score: Math.round(avg(data.map((d) => d.risk_score))),
    peak_risk_score: peak.risk_score,
    peak_time: peak.timestamp,
    total_alerts: sum(data.map((d) => d.alert_count)),
    dominant_status: mode(
      data.map((d) => d.system_status),
      "SAFE"
    ),
    dominant_trend: mode(
      data.map((d) => d.trend),
      "STABLE"
    )
  };
};

const formatDateKey = (date: Date): string => {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const generateInsight = (summary: SnapshotSummary, filter: FilterType): string => {
  const peak = summary.peak_time ? new Date(summary.peak_time).toLocaleString() : "N/A";

  return (
    `Over the selected ${filter} period, SENTINEL recorded an average risk score of ` +
    `${summary.avg_risk_score}/100 (${summary.dominant_status}). ` +
    `Peak risk of ${summary.peak_risk_score} occurred at ${peak}. ` +
    `A total of ${summary.total_alerts} alerts were triggered. ` +
    `Crowd flow trend was predominantly ${summary.dominant_trend}. ` +
    (summary.peak_risk_score >= 76
      ? "Critical congestion events were detected — review alert logs for that period."
      : "No critical congestion events were detected in this period.")
  );
};

const getOrganizationId = (req: RequestWithUser): string => {
  const orgId = req.user?.organizationId?.trim();
  if (!orgId) {
    throw new HttpError(401, "AUTH_401", "Organization context missing");
  }
  return orgId;
};

const loadAnalytics = async (organizationId: string, filter: FilterType, date: Date) => {
  const { start, end } = getRange(filter, date);

  const docs = await AnalyticsSnapshot.find({
    organizationId,
    timestamp: {
      $gte: start,
      $lt: end
    }
  })
    .sort({ timestamp: 1 })
    .lean<LeanSnapshot[]>();

  const data = buildPoints(filter, docs);
  const summary = buildSummary(data);

  return {
    filter,
    date: formatDateKey(date),
    data,
    summary
  };
};

router.get("/snapshots", authenticate, async (req: RequestWithUser, res, next) => {
  try {
    const organizationId = getOrganizationId(req);
    const filter = parseFilter(req.query.filter);
    const date = parseDate(req.query.date);
    const payload = await loadAnalytics(organizationId, filter, date);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.get("/insight", authenticate, async (req: RequestWithUser, res, next) => {
  try {
    const organizationId = getOrganizationId(req);
    const filter = parseFilter(req.query.filter);
    const date = parseDate(req.query.date);
    const payload = await loadAnalytics(organizationId, filter, date);

    return res.json({
      filter: payload.filter,
      date: payload.date,
      insight: generateInsight(payload.summary, payload.filter)
    });
  } catch (error) {
    return next(error);
  }
});