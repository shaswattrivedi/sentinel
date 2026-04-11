import axios from "axios";
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { AnalyticsSnapshot } from "../models/analyticsSnapshot.js";
import type { TrendStatus, ZoneStatus } from "../models/analyticsSnapshot.js";
import type { RequestWithUser } from "../middleware/auth.js";

type FilterType = "daily" | "weekly" | "monthly";
type SourceFilter = "all" | "live" | "seed";
type ParsedDate = {
  year: number;
  month: number;
  day: number;
};

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

type AggregatedDoc = {
  _id: {
    hour?: number;
    minute?: number;
    year?: number;
    month?: number;
    day?: number;
  };
  risk_score: number;
  zone_1_people: number;
  zone_2_people: number;
  zone_1_validation: number;
  zone_2_validation: number;
  alert_count: number;
  system_status: ZoneStatus;
  trend: TrendStatus;
  count: number;
};

type MlDashboardSnapshot = {
  timestamp?: string | Date | null;
  risk_score?: number;
  system_status?: ZoneStatus;
  zone_data?: {
    "zone-1"?: {
      cam_people_count?: number;
      validation_score?: number;
    };
    "zone-2"?: {
      cam_people_count?: number;
      validation_score?: number;
    };
  };
  zone_status?: {
    "zone-1"?: ZoneStatus;
    "zone-2"?: ZoneStatus;
  };
  trend_prediction?: {
    trend?: TrendStatus;
  };
};

export const router = Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const LIVE_FRESHNESS_WINDOW_MS = 15 * 60 * 1000;
const SNAPSHOT_TIMEOUT_MS = 5000;

const normalizeMlBaseUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/predict") ? trimmed.slice(0, -"/predict".length) : trimmed;
};

const ML_SERVICE_BASE_URL = normalizeMlBaseUrl(process.env.ML_SERVICE_URL || "http://localhost:8000");

const isFilterType = (value: string): value is FilterType => value === "daily" || value === "weekly" || value === "monthly";

const toUtcDayStart = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

const parseDateParam = (input: unknown): ParsedDate => {
  if (typeof input !== "string" || !input.trim()) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate()
    };
  }

  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new HttpError(400, "REQ_400", "Invalid date query parameter");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new HttpError(400, "REQ_400", "Invalid date query parameter");
  }

  return { year, month, day };
};

const parseFilter = (input: unknown): FilterType => {
  if (typeof input !== "string" || !input.trim()) return "daily";
  const lowered = input.toLowerCase();
  if (!isFilterType(lowered)) throw new HttpError(400, "REQ_400", "Invalid filter query parameter");
  return lowered;
};

const parseSource = (input: unknown): SourceFilter => {
  if (typeof input !== "string" || !input.trim()) return "all";
  const lowered = input.toLowerCase();
  return lowered === "live" || lowered === "seed" ? lowered : "all";
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

const getRange = (filter: FilterType, parsedDate: ParsedDate): { startDate: Date; endDate: Date } => {
  const { year, month, day } = parsedDate;

  if (filter === "daily") {
    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
    return { startDate, endDate };
  }

  if (filter === "weekly") {
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
    const startDate = new Date(endDate.getTime() - 6 * DAY_MS);
    startDate.setUTCHours(0, 0, 0, 0);
    return { startDate, endDate };
  }

  const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  const startDate = new Date(endDate.getTime() - 29 * DAY_MS);
  startDate.setUTCHours(0, 0, 0, 0);
  return { startDate, endDate };
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

const formatDateKey = (parsedDate: ParsedDate): string => {
  const yyyy = parsedDate.year;
  const mm = String(parsedDate.month).padStart(2, "0");
  const dd = String(parsedDate.day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const isSelectedUtcToday = (startDate: Date, filter: FilterType): boolean => {
  if (filter !== "daily") return false;
  const now = new Date();
  return (
    now.getUTCFullYear() === startDate.getUTCFullYear() &&
    now.getUTCMonth() === startDate.getUTCMonth() &&
    now.getUTCDate() === startDate.getUTCDate()
  );
};

const persistLatestLiveSnapshot = async (organizationId: string): Promise<void> => {
  try {
    const { data } = await axios.get<MlDashboardSnapshot>(`${ML_SERVICE_BASE_URL}/dashboard/snapshot`, {
      timeout: SNAPSHOT_TIMEOUT_MS,
      headers: {
        "x-organization-id": organizationId
      }
    });

    const sourceTimestamp = data.timestamp ? new Date(data.timestamp) : undefined;
    if (!sourceTimestamp || Number.isNaN(sourceTimestamp.getTime())) {
      return;
    }

    if (Date.now() - sourceTimestamp.getTime() > LIVE_FRESHNESS_WINDOW_MS) {
      return;
    }

    const existing = await AnalyticsSnapshot.findOne({
      organizationId,
      dataSource: "live",
      timestamp: sourceTimestamp
    })
      .select({ _id: 1 })
      .lean();

    if (existing) {
      return;
    }

    await AnalyticsSnapshot.create({
      organizationId,
      dataSource: "live",
      timestamp: sourceTimestamp,
      risk_score: data.risk_score ?? 0,
      system_status: data.system_status ?? "SAFE",
      zone_1: {
        cam_people_count: data.zone_data?.["zone-1"]?.cam_people_count ?? 0,
        validation_score: data.zone_data?.["zone-1"]?.validation_score ?? 0,
        zone_status: data.zone_status?.["zone-1"] ?? "SAFE"
      },
      zone_2: {
        cam_people_count: data.zone_data?.["zone-2"]?.cam_people_count ?? 0,
        validation_score: data.zone_data?.["zone-2"]?.validation_score ?? 0,
        zone_status: data.zone_status?.["zone-2"] ?? "SAFE"
      },
      trend: data.trend_prediction?.trend ?? "STABLE",
      alert_count: 0
    });
  } catch (error) {
    // Fallback persistence should never fail the analytics response path.
    if (axios.isAxiosError(error)) {
      return;
    }
  }
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

const loadAnalytics = async (
  organizationId: string,
  filter: FilterType,
  sourceFilter: SourceFilter,
  startDate: Date,
  endDate: Date,
  dateKey: string
) => {
  const matchStage: Record<string, any> = {
    organizationId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (sourceFilter === "live" || sourceFilter === "seed") {
    matchStage.dataSource = sourceFilter;
  }

  if (sourceFilter !== "seed" && isSelectedUtcToday(startDate, filter)) {
    await persistLatestLiveSnapshot(organizationId);
  }

  if (sourceFilter === "live" && filter === "daily") {
    const selectedDayStart = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      0,
      0,
      0,
      0
    );
    const now = new Date();
    const todayUtcStart = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0
    );

    if (selectedDayStart === todayUtcStart) {
      const latestLiveDoc = await AnalyticsSnapshot.findOne(matchStage)
        .sort({ timestamp: -1 })
        .select({ timestamp: 1 })
        .lean();

      const latestTs = latestLiveDoc?.timestamp ? new Date(latestLiveDoc.timestamp).getTime() : NaN;
      const isFresh = Number.isFinite(latestTs) && Date.now() - latestTs <= LIVE_FRESHNESS_WINDOW_MS;

      if (!isFresh) {
        return {
          filter,
          source: sourceFilter,
          date: dateKey,
          data: [] as SnapshotPoint[],
          summary: buildSummary([])
        };
      }
    }
  }

  const groupId = filter === "daily"
    ? {
        hour: { $hour: "$timestamp" },
        minute: { $minute: "$timestamp" }
      }
    : {
        year: { $year: "$timestamp" },
        month: { $month: "$timestamp" },
        day: { $dayOfMonth: "$timestamp" }
      };

  const docs = await AnalyticsSnapshot.aggregate<AggregatedDoc>([
    { $match: matchStage },
    { $sort: { timestamp: 1 } },
    {
      $group: {
        _id: groupId,
        risk_score: { $avg: "$risk_score" },
        zone_1_people: { $avg: "$zone_1.cam_people_count" },
        zone_2_people: { $avg: "$zone_2.cam_people_count" },
        zone_1_validation: { $avg: "$zone_1.validation_score" },
        zone_2_validation: { $avg: "$zone_2.validation_score" },
        alert_count: { $sum: "$alert_count" },
        system_status: { $last: "$system_status" },
        trend: { $last: "$trend" },
        count: { $sum: 1 }
      }
    },
    {
      $sort:
        filter === "daily"
          ? { "_id.hour": 1, "_id.minute": 1 }
          : { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
    }
  ]);

  const data = docs.map((doc): SnapshotPoint => {
    const label = filter === "daily"
      ? `${String(doc._id.hour ?? 0).padStart(2, "0")}:${String(doc._id.minute ?? 0).padStart(2, "0")}`
      : `${doc._id.year}-${String(doc._id.month).padStart(2, "0")}-${String(doc._id.day).padStart(2, "0")}`;

    const timestamp = filter === "daily"
      ? new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), doc._id.hour ?? 0, doc._id.minute ?? 0, 0, 0)).toISOString()
      : new Date(Date.UTC(doc._id.year ?? 1970, (doc._id.month ?? 1) - 1, doc._id.day ?? 1, 0, 0, 0, 0)).toISOString();

    return {
      label,
      timestamp,
      risk_score: Math.round(doc.risk_score ?? 0),
      system_status: doc.system_status ?? "SAFE",
      zone_1_people: Math.round(doc.zone_1_people ?? 0),
      zone_2_people: Math.round(doc.zone_2_people ?? 0),
      zone_1_validation: Math.round(doc.zone_1_validation ?? 0),
      zone_2_validation: Math.round(doc.zone_2_validation ?? 0),
      alert_count: Math.round(doc.alert_count ?? 0),
      trend: doc.trend ?? "STABLE"
    };
  });

  const summary = buildSummary(data);

  return {
    filter,
    source: sourceFilter,
    date: dateKey,
    data,
    summary
  };
};

router.get("/snapshots", authenticate, async (req: RequestWithUser, res, next) => {
  try {
    const organizationId = getOrganizationId(req);
    // Parse date param as UTC — never use new Date(dateString) directly
    const dateParam = (req.query.date as string) ??
      new Date().toISOString().slice(0, 10);

    const [y, m, d] = dateParam.split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      throw new HttpError(400, "REQ_400", "Invalid date query parameter");
    }
    // Reference point: end of the selected date in UTC
    const refMs = Date.UTC(y, m - 1, d, 23, 59, 59, 999);

    let startMs: number;
    let endMs: number = refMs;

    const filter = (req.query.filter as string) ?? 'daily';

    if (filter === 'daily') {
      // Full selected day: 00:00:00 to 23:59:59 UTC
      startMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
    } else if (filter === 'weekly') {
      // 7-day window ending on selected date
      startMs = refMs - 6 * 24 * 60 * 60 * 1000;
      startMs = startMs - (startMs % (24 * 60 * 60 * 1000)); // floor to day
    } else {
      // monthly: 30-day window ending on selected date
      startMs = refMs - 29 * 24 * 60 * 60 * 1000;
      startMs = startMs - (startMs % (24 * 60 * 60 * 1000)); // floor to day
    }

    const startDate = new Date(startMs);
    const endDate   = new Date(endMs);

    const sourceFilter = parseSource(req.query.source);
    const normalizedFilter = parseFilter(filter);

    const payload = await loadAnalytics(
      organizationId,
      normalizedFilter,
      sourceFilter,
      startDate,
      endDate,
      dateParam
    );
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.get("/insight", authenticate, async (req: RequestWithUser, res, next) => {
  try {
    const organizationId = getOrganizationId(req);
    // Parse date param as UTC — never use new Date(dateString) directly
    const dateParam = (req.query.date as string) ??
      new Date().toISOString().slice(0, 10);

    const [y, m, d] = dateParam.split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      throw new HttpError(400, "REQ_400", "Invalid date query parameter");
    }
    // Reference point: end of the selected date in UTC
    const refMs = Date.UTC(y, m - 1, d, 23, 59, 59, 999);

    let startMs: number;
    let endMs: number = refMs;

    const filter = (req.query.filter as string) ?? 'daily';

    if (filter === 'daily') {
      // Full selected day: 00:00:00 to 23:59:59 UTC
      startMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
    } else if (filter === 'weekly') {
      // 7-day window ending on selected date
      startMs = refMs - 6 * 24 * 60 * 60 * 1000;
      startMs = startMs - (startMs % (24 * 60 * 60 * 1000)); // floor to day
    } else {
      // monthly: 30-day window ending on selected date
      startMs = refMs - 29 * 24 * 60 * 60 * 1000;
      startMs = startMs - (startMs % (24 * 60 * 60 * 1000)); // floor to day
    }

    const startDate = new Date(startMs);
    const endDate   = new Date(endMs);

    const sourceFilter = parseSource(req.query.source);
    const normalizedFilter = parseFilter(filter);

    const payload = await loadAnalytics(
      organizationId,
      normalizedFilter,
      sourceFilter,
      startDate,
      endDate,
      dateParam
    );

    return res.json({
      filter: payload.filter,
      source: payload.source,
      date: payload.date,
      insight: generateInsight(payload.summary, payload.filter)
    });
  } catch (error) {
    return next(error);
  }
});