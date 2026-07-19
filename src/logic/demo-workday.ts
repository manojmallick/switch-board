import { computeSwitchCost, type SwitchEvent } from "./switch-cost";
import type { SwitchSession } from "./switch-session";

export const DEMO_WORKDAY_STARTED_AT = Date.parse("2026-07-16T09:00:00.000Z");
const hour = 60 * 60 * 1000;

// A fixed, fictional eight-hour workday. It is intentionally not tuned to a target headline.
export const DEMO_WORKDAY_EVENTS: readonly SwitchEvent[] = Object.freeze(
  [
    { ventureId: "demo-learning-lab", timestamp: DEMO_WORKDAY_STARTED_AT },
    { ventureId: "demo-learning-lab", timestamp: DEMO_WORKDAY_STARTED_AT + 0.5 * hour },
    { ventureId: "demo-advisory-co", timestamp: DEMO_WORKDAY_STARTED_AT + 1.2 * hour },
    { ventureId: "demo-advisory-co", timestamp: DEMO_WORKDAY_STARTED_AT + 1.6 * hour },
    { ventureId: "demo-learning-lab", timestamp: DEMO_WORKDAY_STARTED_AT + 2.1 * hour },
    { ventureId: "demo-systems-studio", timestamp: DEMO_WORKDAY_STARTED_AT + 3.8 * hour },
    { ventureId: "demo-learning-lab", timestamp: DEMO_WORKDAY_STARTED_AT + 4.2 * hour },
    { ventureId: "demo-advisory-co", timestamp: DEMO_WORKDAY_STARTED_AT + 5 * hour },
    { ventureId: "demo-learning-lab", timestamp: DEMO_WORKDAY_STARTED_AT + 6.5 * hour },
  ].map((event) => Object.freeze(event)),
);

export const DEMO_WORKDAY_RESULT = Object.freeze(computeSwitchCost(DEMO_WORKDAY_EVENTS));

export function createDemoWorkdaySession(eventCount = DEMO_WORKDAY_EVENTS.length): SwitchSession {
  if (!Number.isInteger(eventCount) || eventCount < 1 || eventCount > DEMO_WORKDAY_EVENTS.length) {
    throw new RangeError(
      `eventCount must be an integer from 1 to ${DEMO_WORKDAY_EVENTS.length}.`,
    );
  }

  const events = DEMO_WORKDAY_EVENTS.slice(0, eventCount);
  const firstEvent = events[0];
  const activeEvent = events.at(-1);

  if (!firstEvent || !activeEvent) {
    throw new Error("The demo workday fixture must contain at least one event.");
  }

  return {
    initialVentureId: firstEvent.ventureId,
    activeVentureId: activeEvent.ventureId,
    events,
  };
}
