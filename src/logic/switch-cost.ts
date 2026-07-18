export interface SwitchEvent {
  readonly ventureId: string;
  readonly timestamp: number;
}

export interface SwitchCostAssumptions {
  readonly baseReorientationMinutes: number;
  readonly coldSwitchMultiplier: number;
  readonly coldThresholdMs: number;
  readonly firstEntryIsCold: boolean;
}

export interface SwitchCostTimelineEntry {
  readonly fromVentureId: string;
  readonly ventureId: string;
  readonly timestamp: number;
  readonly previousTouchedAt: number | null;
  readonly minutesAway: number | null;
  readonly costMinutes: number;
  readonly wasCold: boolean;
}

export interface SwitchCostResult {
  readonly totalSwitches: number;
  readonly coldSwitches: number;
  readonly estimatedMinutes: number;
  readonly assumptions: SwitchCostAssumptions;
  readonly timeline: readonly SwitchCostTimelineEntry[];
}

/**
 * Product assumptions, not a scientific measurement of productivity loss.
 * They stay explicit so a future settings screen can make them user-configurable.
 */
export const DEFAULT_SWITCH_COST_ASSUMPTIONS: SwitchCostAssumptions = Object.freeze({
  baseReorientationMinutes: 9,
  coldSwitchMultiplier: 2.1,
  coldThresholdMs: 4 * 60 * 60 * 1000,
  firstEntryIsCold: true,
});

function validateEvent(event: SwitchEvent, index: number): void {
  if (event.ventureId.trim().length === 0) {
    throw new TypeError(`Switch event at index ${index} must have a non-empty ventureId.`);
  }

  if (!Number.isFinite(event.timestamp)) {
    throw new TypeError(`Switch event at index ${index} must have a finite timestamp.`);
  }
}

function validateAssumptions(assumptions: SwitchCostAssumptions): void {
  if (
    !Number.isFinite(assumptions.baseReorientationMinutes) ||
    assumptions.baseReorientationMinutes < 0
  ) {
    throw new RangeError("baseReorientationMinutes must be a finite, non-negative number.");
  }

  if (!Number.isFinite(assumptions.coldSwitchMultiplier) || assumptions.coldSwitchMultiplier < 1) {
    throw new RangeError("coldSwitchMultiplier must be a finite number greater than or equal to 1.");
  }

  if (!Number.isFinite(assumptions.coldThresholdMs) || assumptions.coldThresholdMs < 0) {
    throw new RangeError("coldThresholdMs must be a finite, non-negative number.");
  }
}

/**
 * Estimates a re-orientation budget from venture-entry events.
 *
 * Events are processed chronologically without mutating the caller's array. Equal timestamps
 * preserve caller order. A return becomes cold only after more than the configured threshold;
 * exactly four hours is warm under the defaults. First entry into an unseen venture is cold.
 */
export function computeSwitchCost(
  rawEvents: readonly SwitchEvent[],
  assumptions: SwitchCostAssumptions = DEFAULT_SWITCH_COST_ASSUMPTIONS,
): SwitchCostResult {
  validateAssumptions(assumptions);

  const events = rawEvents
    .map((event, index) => {
      validateEvent(event, index);
      return { event, originalIndex: index };
    })
    .sort(
      (left, right) =>
        left.event.timestamp - right.event.timestamp || left.originalIndex - right.originalIndex,
    )
    .map(({ event }) => event);

  const timeline: SwitchCostTimelineEntry[] = [];
  const lastTouched = new Map<string, number>();

  if (events.length === 0) {
    return {
      totalSwitches: 0,
      coldSwitches: 0,
      estimatedMinutes: 0,
      assumptions: { ...assumptions },
      timeline,
    };
  }

  lastTouched.set(events[0].ventureId, events[0].timestamp);
  let unroundedMinutes = 0;

  for (let index = 1; index < events.length; index += 1) {
    const previous = events[index - 1];
    const current = events[index];

    if (current.ventureId === previous.ventureId) {
      lastTouched.set(current.ventureId, current.timestamp);
      continue;
    }

    const previousTouchedAt = lastTouched.get(current.ventureId) ?? null;
    const minutesAway =
      previousTouchedAt === null ? null : (current.timestamp - previousTouchedAt) / 60_000;
    const wasCold =
      previousTouchedAt === null
        ? assumptions.firstEntryIsCold
        : current.timestamp - previousTouchedAt > assumptions.coldThresholdMs;
    const rawCostMinutes =
      assumptions.baseReorientationMinutes * (wasCold ? assumptions.coldSwitchMultiplier : 1);
    const costMinutes = Number(rawCostMinutes.toFixed(2));

    unroundedMinutes += costMinutes;
    timeline.push({
      fromVentureId: previous.ventureId,
      ventureId: current.ventureId,
      timestamp: current.timestamp,
      previousTouchedAt,
      minutesAway,
      costMinutes,
      wasCold,
    });
    lastTouched.set(current.ventureId, current.timestamp);
  }

  return {
    totalSwitches: timeline.length,
    coldSwitches: timeline.filter((entry) => entry.wasCold).length,
    estimatedMinutes: Math.round(unroundedMinutes),
    assumptions: { ...assumptions },
    timeline,
  };
}

export function formatCostSummary(result: SwitchCostResult): string {
  const switchLabel = result.totalSwitches === 1 ? "time" : "times";
  const hours = (result.estimatedMinutes / 60).toFixed(1);

  return `You switched ventures ${result.totalSwitches} ${switchLabel}. Estimated re-orientation budget: ${result.estimatedMinutes} minutes (${hours} hours).`;
}
