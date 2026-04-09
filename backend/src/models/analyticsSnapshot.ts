import mongoose, { Document, Schema } from "mongoose";

export type ZoneStatus = "SAFE" | "MODERATE" | "CRITICAL";
export type TrendStatus = "INCREASING" | "STABLE" | "DECREASING";

export interface IAnalyticsSnapshot extends Document {
  organizationId: string;
  timestamp: Date;
  risk_score: number;
  system_status: ZoneStatus;
  zone_1: {
    cam_people_count: number;
    validation_score: number;
    zone_status: ZoneStatus;
  };
  zone_2: {
    cam_people_count: number;
    validation_score: number;
    zone_status: ZoneStatus;
  };
  trend: TrendStatus;
  alert_count: number;
}

const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
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

export const AnalyticsSnapshot = mongoose.model<IAnalyticsSnapshot>("AnalyticsSnapshot", AnalyticsSnapshotSchema);