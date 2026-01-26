import { alertService } from "./alertService.js";

export type RiskState = "SAFE" | "WARNING" | "DANGER";

export interface RiskEvent {
  timestamp: string;
  zoneId: string;
  riskScore: number;
  riskState: RiskState;
  reason: string;
}

const riskOrder: Record<RiskState, number> = {
  SAFE: 0,
  WARNING: 1,
  DANGER: 2
};

const events: RiskEvent[] = [
  {
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    zoneId: "zone-1",
    riskScore: 0.12,
    riskState: "SAFE",
    reason: "Nominal foot traffic"
  },
  {
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    zoneId: "zone-1",
    riskScore: 0.62,
    riskState: "WARNING",
    reason: "Increased density detected"
  }
];

const sortEventsDesc = () => {
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const riskService = {
  addEvent(event: RiskEvent): RiskEvent {
    events.push(event);
    sortEventsDesc();

    const previous = events.find((e) => e.zoneId === event.zoneId && e.timestamp < event.timestamp);
    if (previous && riskOrder[event.riskState] > riskOrder[previous.riskState]) {
      alertService.triggerRiskEscalation(event, previous);
    }

    return event;
  },

  getCurrent(zoneId?: string): RiskEvent | undefined {
    sortEventsDesc();
    if (!zoneId) return events[0];
    return events.find((e) => e.zoneId === zoneId);
  },

  getTimeline(start?: Date, end?: Date): RiskEvent[] {
    sortEventsDesc();
    return events
      .filter((e) => {
        const ts = new Date(e.timestamp).getTime();
        if (start && ts < start.getTime()) return false;
        if (end && ts > end.getTime()) return false;
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
};
