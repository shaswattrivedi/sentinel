export interface CrowdTrendInput {
  zoneId: string;
  horizonMinutes: number;
}

export interface CrowdTrendPrediction {
  predictedCount: number;
  confidence: number; // 0-1
  timeWindow: string;
}

export const mlClient = {
  async predictCrowdTrend(input: CrowdTrendInput): Promise<CrowdTrendPrediction> {
    // Mocked response for now; replace with real ML call
    const multiplier = input.horizonMinutes / 30;
    return {
      predictedCount: Math.round(80 * multiplier),
      confidence: 0.78,
      timeWindow: `${input.horizonMinutes}m`
    };
  }
};
