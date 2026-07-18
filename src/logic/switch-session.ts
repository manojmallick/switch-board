import type { SwitchEvent } from "./switch-cost";

export interface SwitchSession {
  readonly initialVentureId: string;
  readonly activeVentureId: string;
  readonly events: readonly SwitchEvent[];
}

export interface PlugInResult {
  readonly session: SwitchSession;
  readonly eventLogged: boolean;
}

function validateEntry(ventureId: string, timestamp: number): void {
  if (ventureId.trim().length === 0) {
    throw new TypeError("A switch session requires a non-empty ventureId.");
  }

  if (!Number.isFinite(timestamp)) {
    throw new TypeError("A switch session requires a finite timestamp.");
  }
}

export function createSwitchSession(ventureId: string, startedAt: number): SwitchSession {
  validateEntry(ventureId, startedAt);

  return {
    initialVentureId: ventureId,
    activeVentureId: ventureId,
    events: [{ ventureId, timestamp: startedAt }],
  };
}

export function plugIntoVenture(
  session: SwitchSession,
  ventureId: string,
  timestamp: number,
): PlugInResult {
  validateEntry(ventureId, timestamp);

  if (ventureId === session.activeVentureId) {
    return { session, eventLogged: false };
  }

  return {
    eventLogged: true,
    session: {
      ...session,
      activeVentureId: ventureId,
      events: [...session.events, { ventureId, timestamp }],
    },
  };
}

export function resetSwitchSession(session: SwitchSession, restartedAt: number): SwitchSession {
  return createSwitchSession(session.initialVentureId, restartedAt);
}
