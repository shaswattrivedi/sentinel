import api from "@/api/client";
import mlApi from "@/api/mlClient";
import {
  AlertsPayload,
  DecisionPayload,
  FlowPayload,
  OverviewPayload,
  TimelinePayload
} from "@/types/ml";

export const getOverview = async () => {
  const res = await mlApi.get<OverviewPayload>("/dashboard/overview");
  return res.data.data;
};

export const getTimeline = async () => {
  const res = await mlApi.get<TimelinePayload>("/dashboard/timeline");
  return res.data.data;
};

export const getFlow = async () => {
  const res = await mlApi.get<FlowPayload>("/dashboard/flow");
  return res.data.data;
};

export const getAlerts = async () => {
  const res = await mlApi.get<AlertsPayload>("/dashboard/alerts");
  return res.data.data;
};

export const getDecision = async () => {
  const res = await mlApi.get<DecisionPayload>("/dashboard/decision");
  return res.data.data;
};
