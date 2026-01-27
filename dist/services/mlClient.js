export const mlClient = {
    async predictCrowdTrend(input) {
        // Mocked response for now; replace with real ML call
        const multiplier = input.horizonMinutes / 30;
        return {
            predictedCount: Math.round(80 * multiplier),
            confidence: 0.78,
            timeWindow: `${input.horizonMinutes}m`
        };
    }
};
