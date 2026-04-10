import { alertService } from "./alertService.js";

export type RiskState = "SAFE" | "WARNING" | "DANGER";

export interface RiskEvent {
  timestamp: string;
  zoneId: string;
  riskScore: number;
  riskState: RiskState;
  reason: string;
}

const DEFAULT_ORGANIZATION_ID = "default-org";

const riskOrder: Record<RiskState, number> = {
  SAFE: 0,
  WARNING: 1,
  DANGER: 2
};

const eventsByOrganization = new Map<string, RiskEvent[]>();

const normalizeOrganizationId = (organizationId: string | undefined): string => {
  const normalized = organizationId?.trim();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_ORGANIZATION_ID;
};

const buildInitialEvents = (): RiskEvent[] => [
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

const getOrganizationEvents = (organizationId: string): RiskEvent[] => {
  const orgId = normalizeOrganizationId(organizationId);
  let events = eventsByOrganization.get(orgId);
  if (!events) {
    events = buildInitialEvents();
    eventsByOrganization.set(orgId, events);
  }
  return events;
};

const sortEventsDesc = (events: RiskEvent[]) => {
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const riskService = {
  addEvent(organizationId: string, event: RiskEvent): RiskEvent {
    const events = getOrganizationEvents(organizationId);
    events.push(event);
    sortEventsDesc(events);

    const previous = events.find((e) => e.zoneId === event.zoneId && e.timestamp < event.timestamp);
    if (previous && riskOrder[event.riskState] > riskOrder[previous.riskState]) {
      alertService.triggerRiskEscalation(event, previous, organizationId);
    }

    return event;
  },

  getCurrent(organizationId: string, zoneId?: string): RiskEvent | undefined {
    const events = getOrganizationEvents(organizationId);
    sortEventsDesc(events);
    if (!zoneId) return events[0];
    return events.find((e) => e.zoneId === zoneId);
  },

  getTimeline(organizationId: string, start?: Date, end?: Date): RiskEvent[] {
    const events = getOrganizationEvents(organizationId);
    sortEventsDesc(events);
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
