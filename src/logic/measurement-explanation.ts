import type { SwitchCostResult, SwitchCostTimelineEntry } from "./switch-cost";

export type MeasurementClassification = "first-entry" | "warm-return" | "cold-return";

export interface MeasurementExplanationTransition {
  readonly fromVentureId: string;
  readonly ventureId: string;
  readonly classification: MeasurementClassification;
  readonly minutesAway: number | null;
  readonly costMinutes: number;
  readonly reason: string;
}

export interface MeasurementExplanation {
  readonly baseReorientationMinutes: number;
  readonly coldSwitchMultiplier: number;
  readonly coldThresholdMinutes: number;
  readonly firstEntryIsCold: boolean;
  readonly contributionMinutes: number;
  readonly displayedMinutes: number;
  readonly transitions: readonly MeasurementExplanationTransition[];
}

function formatMinutes(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function explainTransition(
  entry: SwitchCostTimelineEntry,
  thresholdMinutes: number,
): MeasurementExplanationTransition {
  if (entry.previousTouchedAt === null) {
    return {
      fromVentureId: entry.fromVentureId,
      ventureId: entry.ventureId,
      classification: "first-entry",
      minutesAway: null,
      costMinutes: entry.costMinutes,
      reason: entry.wasCold
        ? "First recorded entry to this venture, so the cold-entry multiplier applies."
        : "First recorded entry to this venture; the configured first-entry rule uses base cost.",
    };
  }

  const minutesAway = entry.minutesAway ?? 0;
  const awayLabel = `${formatMinutes(minutesAway)} minutes`;
  const thresholdLabel = `${formatMinutes(thresholdMinutes)} minutes`;

  if (entry.wasCold) {
    return {
      fromVentureId: entry.fromVentureId,
      ventureId: entry.ventureId,
      classification: "cold-return",
      minutesAway,
      costMinutes: entry.costMinutes,
      reason: `Returned after ${awayLabel}, which is more than the ${thresholdLabel} cold threshold.`,
    };
  }

  const boundaryReason =
    minutesAway === thresholdMinutes
      ? `Returned after exactly ${awayLabel}; the threshold is strict, so this return stays warm.`
      : `Returned after ${awayLabel}, within the ${thresholdLabel} warm window.`;

  return {
    fromVentureId: entry.fromVentureId,
    ventureId: entry.ventureId,
    classification: "warm-return",
    minutesAway,
    costMinutes: entry.costMinutes,
    reason: boundaryReason,
  };
}

/** Derives user-facing evidence exclusively from an already-computed estimator result. */
export function explainSwitchCost(result: SwitchCostResult): MeasurementExplanation {
  const coldThresholdMinutes = result.assumptions.coldThresholdMs / 60_000;
  const transitions = result.timeline.map((entry) =>
    explainTransition(entry, coldThresholdMinutes),
  );
  const contributionMinutes = Number(
    transitions.reduce((sum, transition) => sum + transition.costMinutes, 0).toFixed(2),
  );

  return {
    baseReorientationMinutes: result.assumptions.baseReorientationMinutes,
    coldSwitchMultiplier: result.assumptions.coldSwitchMultiplier,
    coldThresholdMinutes,
    firstEntryIsCold: result.assumptions.firstEntryIsCold,
    contributionMinutes,
    displayedMinutes: result.estimatedMinutes,
    transitions,
  };
}
