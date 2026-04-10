import { client } from "./client";

export interface Scenario {
  id: number;
  name: string;
  description: string;
}

export interface SimulationStatus {
  running: boolean;
  orgId: string;
  scenario?: number;
  scenarioName?: string;
  duration?: number;
  elapsed?: number;
  tick?: number;
  startedAt?: string;
}

export const fetchScenarios = async (): Promise<Scenario[]> => {
  const { data } = await client.get("/admin/scenarios");
  return data.data;
};

export const fetchAllSimulationStatuses = async (): Promise<SimulationStatus[]> => {
  const { data } = await client.get("/admin/simulate/status");
  return data.data;
};

export const startSimulation = async (orgId: string, scenario: number, duration: number): Promise<void> => {
  await client.post("/admin/simulate/start", { orgId, scenario, duration });
};

export const stopSimulation = async (orgId: string): Promise<void> => {
  await client.post("/admin/simulate/stop", { orgId });
};
