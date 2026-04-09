import axios from "axios";
import { AnalyticsSnapshot } from "../models/analyticsSnapshot.js";
import type { TrendStatus, ZoneStatus } from "../models/analyticsSnapshot.js";

type MlDashboardSnapshot = {
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

let alertCountBuffer = 0;
let schedulerId: NodeJS.Timeout | null = null;
let mlUnavailable = false;

export function incrementAlertCount() {
  alertCountBuffer += 1;
}

export async function takeSnapshot(): Promise<void> {
  try {
    const { data } = await axios.get<MlDashboardSnapshot>(`${ML_SERVICE_URL}/dashboard/snapshot`, {
      timeout: SNAPSHOT_TIMEOUT_MS
    });

    await AnalyticsSnapshot.create({
      organizationId: "org_1", // Default org for live snapshots
      timestamp: new Date(),
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
      alert_count: alertCountBuffer
    });

    if (mlUnavailable) {
      console.log("[Snapshot] ML service connection restored");
      mlUnavailable = false;
    }

    alertCountBuffer = 0;
    console.log("[Snapshot] Saved at", new Date().toISOString());
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const code = err.code ?? "UNKNOWN";
      const isNetworkFailure = code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ECONNABORTED";
      if (isNetworkFailure) {
        if (!mlUnavailable) {
          console.warn(
            `[Snapshot] ML service unavailable (${code}) at ${ML_SERVICE_URL}. ` +
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