import axios from "axios";
import { AnalyticsSnapshot } from "../models/analyticsSnapshot.js";
import type { TrendStatus, ZoneStatus } from "../models/analyticsSnapshot.js";
import { UserModel } from "../models/user.js";

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

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const SNAPSHOT_TIMEOUT_MS = 5000;
const LIVE_FRESHNESS_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_ORGANIZATION_ID = "default-org";

const normalizeMlBaseUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/predict") ? trimmed.slice(0, -"/predict".length) : trimmed;
};

const ML_SERVICE_BASE_URL = normalizeMlBaseUrl(ML_SERVICE_URL);

const alertCountBufferByOrganization = new Map<string, number>();
let schedulerId: NodeJS.Timeout | null = null;
let mlUnavailable = false;

const normalizeOrganizationId = (organizationId: string | undefined): string => {
  const normalized = organizationId?.trim();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_ORGANIZATION_ID;
};

const getKnownOrganizationIds = async (): Promise<string[]> => {
  const organizationIds = await UserModel.distinct("organizationId");
  const normalized = organizationIds
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return normalized.length > 0 ? Array.from(new Set(normalized)) : [DEFAULT_ORGANIZATION_ID];
};

export function incrementAlertCount(organizationId: string) {
  const orgId = normalizeOrganizationId(organizationId);
  const previous = alertCountBufferByOrganization.get(orgId) ?? 0;
  alertCountBufferByOrganization.set(orgId, previous + 1);
}

export async function takeSnapshot(): Promise<void> {
  try {
    const organizationIds = await getKnownOrganizationIds();

    for (const organizationId of organizationIds) {
      const { data } = await axios.get<MlDashboardSnapshot>(`${ML_SERVICE_BASE_URL}/dashboard/snapshot`, {
        timeout: SNAPSHOT_TIMEOUT_MS,
        headers: {
          "x-organization-id": organizationId
        }
      });

      const sourceTimestamp = data.timestamp ? new Date(data.timestamp) : undefined;
      if (!sourceTimestamp || Number.isNaN(sourceTimestamp.getTime())) {
        // Skip default/empty dashboard snapshots when hardware has not produced a real update yet.
        continue;
      }

      if (Date.now() - sourceTimestamp.getTime() > LIVE_FRESHNESS_WINDOW_MS) {
        // Do not persist stale snapshots when there is no recent live telemetry update.
        continue;
      }

      const alertCount = alertCountBufferByOrganization.get(organizationId) ?? 0;

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
        alert_count: alertCount
      });

      alertCountBufferByOrganization.set(organizationId, 0);
    }

    if (mlUnavailable) {
      console.log("[Snapshot] ML service connection restored");
      mlUnavailable = false;
    }

    console.log(`[Snapshot] Saved at ${new Date().toISOString()} for ${organizationIds.length} organization(s)`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const code = err.code ?? "UNKNOWN";
      const isNetworkFailure = code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ECONNABORTED";
      if (isNetworkFailure) {
        if (!mlUnavailable) {
          console.warn(
            `[Snapshot] ML service unavailable (${code}) at ${ML_SERVICE_BASE_URL}. ` +
              "Snapshots will retry automatically every 5 minutes."
          );
          mlUnavailable = true;
        }
        return;
      }

      console.error(`[Snapshot] Request failed (${code}):`, err.message);
      return;
    }

    console.error("[Snapshot] Failed:", err);
  }
}

export function startSnapshotScheduler(): void {
  if (schedulerId) return;

  console.log("[Snapshot] Scheduler started - interval: 5 minutes");
  void takeSnapshot();
  schedulerId = setInterval(() => {
    void takeSnapshot();
  }, 5 * 60 * 1000);
}