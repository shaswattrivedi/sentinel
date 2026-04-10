import axios from "axios";

const ML_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";
const SIM_INTERVAL_MS = 1500;

const SCENARIOS: Record<number, { name: string; description: string }> = {
  1: { name: "NORMAL", description: "Low density, all zones safe" },
  2: { name: "GRADUAL_INCREASE", description: "Slowly increasing crowd" },
  3: { name: "CRITICAL_Z1", description: "Zone 1 goes critical" },
  4: { name: "CRITICAL_Z2", description: "Zone 2 goes critical" },
  5: { name: "MULTI_ZONE_CRITICAL", description: "Both zones critical" },
  6: { name: "WAVE_PATTERN", description: "Oscillating density" },
  7: { name: "RANDOM", description: "Randomized realistic data" },
  8: { name: "CROWD_FLOW", description: "Simulated zone-to-zone movement" }
};

interface ZonePayload {
  cam_people_count: number;
  cam_confidence: number;
  validation_score: number;
}

interface SimulationState {
  orgId: string;
  scenario: number;
  duration: number;
  startedAt: Date;
  tick: number;
  intervalHandle: ReturnType<typeof setInterval> | null;
}

const activeSimulations = new Map<string, SimulationState>();

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

function generatePayload(scenario: number, tick: number): Record<string, ZonePayload> {
  switch (scenario) {
    case 1: // NORMAL
      return {
        "zone-1": { cam_people_count: 2, cam_confidence: 0.8, validation_score: 15 },
        "zone-2": { cam_people_count: 1, cam_confidence: 0.8, validation_score: 10 }
      };

    case 2: { // GRADUAL_INCREASE
      const z1Count = clamp(1 + Math.floor(tick * 0.7), 1, 20);
      const z2Count = clamp(1 + Math.floor(tick * 0.55), 1, 18);
      const z1Validation = clamp(18 + tick * 2.8, 0, 100);
      const z2Validation = clamp(15 + tick * 2.4, 0, 100);
      return {
        "zone-1": { cam_people_count: z1Count, cam_confidence: 0.82, validation_score: z1Validation },
        "zone-2": { cam_people_count: z2Count, cam_confidence: 0.8, validation_score: z2Validation }
      };
    }

    case 3: // CRITICAL_Z1
      return {
        "zone-1": {
          cam_people_count: Math.min(20, 5 + tick),
          cam_confidence: 0.85,
          validation_score: Math.min(100, 30 + tick * 3)
        },
        "zone-2": { cam_people_count: 2, cam_confidence: 0.8, validation_score: 15 }
      };

    case 4: // CRITICAL_Z2
      return {
        "zone-1": { cam_people_count: 2, cam_confidence: 0.8, validation_score: 15 },
        "zone-2": {
          cam_people_count: Math.min(20, 5 + tick),
          cam_confidence: 0.85,
          validation_score: Math.min(100, 30 + tick * 3)
        }
      };

    case 5: // MULTI_ZONE_CRITICAL
      return {
        "zone-1": {
          cam_people_count: Math.min(20, 8 + tick),
          cam_confidence: 0.85,
          validation_score: Math.min(100, 50 + tick * 2)
        },
        "zone-2": {
          cam_people_count: Math.min(18, 6 + tick),
          cam_confidence: 0.82,
          validation_score: Math.min(100, 45 + tick * 2)
        }
      };

    case 6: { // WAVE_PATTERN
      const wave = Math.sin(tick * 0.3) * 10 + 10;
      return {
        "zone-1": { cam_people_count: Math.round(wave), cam_confidence: 0.8, validation_score: clamp(wave * 4, 0, 100) },
        "zone-2": { cam_people_count: Math.round(wave * 0.8), cam_confidence: 0.8, validation_score: clamp(wave * 3.5, 0, 100) }
      };
    }

    case 8: { // CROWD_FLOW
      const t = tick % 40;

      let z1 = 1;
      let z2 = 1;
      let v1 = 10;
      let v2 = 10;

      if (t >= 0 && t < 18) {
        z1 = Math.round(1 + Math.sin((t / 18) * Math.PI) * 16);
        v1 = 15 + Math.sin((t / 18) * Math.PI) * 75;
      }

      if (t >= 8 && t < 30) {
        z2 = Math.round(1 + Math.sin(((t - 8) / 22) * Math.PI) * 16);
        v2 = 15 + Math.sin(((t - 8) / 22) * Math.PI) * 75;
      }

      return {
        "zone-1": { cam_people_count: clamp(z1, 0, 20), cam_confidence: 0.82, validation_score: clamp(v1, 0, 100) },
        "zone-2": { cam_people_count: clamp(z2, 0, 18), cam_confidence: 0.8, validation_score: clamp(v2, 0, 100) }
      };
    }

    case 7: // RANDOM
    default:
      return {
        "zone-1": {
          cam_people_count: Math.floor(Math.random() * 20),
          cam_confidence: 0.75 + Math.random() * 0.2,
          validation_score: Math.random() * 100
        },
        "zone-2": {
          cam_people_count: Math.floor(Math.random() * 18),
          cam_confidence: 0.75 + Math.random() * 0.2,
          validation_score: Math.random() * 100
        }
      };
  }
}

export function getScenarios() {
  return Object.entries(SCENARIOS).map(([id, scenario]) => ({ id: Number(id), ...scenario }));
}

export function getSimulationStatus(orgId: string) {
  const sim = activeSimulations.get(orgId);
  if (!sim) return { running: false, orgId };

  return {
    running: true,
    orgId: sim.orgId,
    scenario: sim.scenario,
    scenarioName: SCENARIOS[sim.scenario]?.name,
    duration: sim.duration,
    startedAt: sim.startedAt,
    tick: sim.tick,
    elapsed: Math.floor((Date.now() - sim.startedAt.getTime()) / 1000)
  };
}

export function getAllSimulationStatuses() {
  return Array.from(activeSimulations.values()).map((sim) => getSimulationStatus(sim.orgId));
}

export async function startSimulation(orgId: string, scenario: number, duration: number): Promise<void> {
  if (!SCENARIOS[scenario]) {
    throw new Error(`Unsupported scenario: ${scenario}`);
  }

  if (activeSimulations.has(orgId)) {
    stopSimulation(orgId);
  }

  const state: SimulationState = {
    orgId,
    scenario,
    duration,
    startedAt: new Date(),
    tick: 0,
    intervalHandle: null
  };

  const handle = setInterval(() => {
    void (async () => {
      state.tick += 1;
      const elapsed = (Date.now() - state.startedAt.getTime()) / 1000;

      if (elapsed >= duration) {
        stopSimulation(orgId);
        return;
      }

      const zoneData = generatePayload(scenario, state.tick);
      const payload = {
        timestamp: new Date().toISOString(),
        ...zoneData
      };

      try {
        await axios.post(`${ML_URL}/predict`, payload, {
          headers: {
            "Content-Type": "application/json",
            "x-organization-id": orgId
          },
          timeout: 3000
        });
      } catch {
        // Keep simulation loop alive even when ML misses a tick.
      }
    })();
  }, SIM_INTERVAL_MS);

  state.intervalHandle = handle;
  activeSimulations.set(orgId, state);
}

export function stopSimulation(orgId: string): void {
  const sim = activeSimulations.get(orgId);
  if (sim?.intervalHandle) clearInterval(sim.intervalHandle);
  activeSimulations.delete(orgId);
}