import assert from "node:assert/strict";
import test from "node:test";

import {
  computeSwitchCost,
  DEFAULT_SWITCH_COST_ASSUMPTIONS,
  formatCostSummary,
  type SwitchEvent,
} from "./switch-cost";

const hour = 60 * 60 * 1000;

test("zero, one, and repeated same-venture events have no switch cost", () => {
  assert.equal(computeSwitchCost([]).totalSwitches, 0);
  assert.equal(computeSwitchCost([{ ventureId: "alpha", timestamp: 0 }]).totalSwitches, 0);
  assert.deepEqual(
    computeSwitchCost([
      { ventureId: "alpha", timestamp: 0 },
      { ventureId: "alpha", timestamp: hour },
    ]).timeline,
    [],
  );
});

test("first entries are cold and a return within four hours is warm", () => {
  const result = computeSwitchCost([
    { ventureId: "alpha", timestamp: 0 },
    { ventureId: "beta", timestamp: hour },
    { ventureId: "alpha", timestamp: 2 * hour },
  ]);

  assert.equal(result.totalSwitches, 2);
  assert.equal(result.coldSwitches, 1);
  assert.equal(result.estimatedMinutes, 28);
  assert.equal(result.timeline[0].previousTouchedAt, null);
  assert.equal(result.timeline[0].wasCold, true);
  assert.equal(result.timeline[0].costMinutes, 18.9);
  assert.equal(result.timeline[1].minutesAway, 120);
  assert.equal(result.timeline[1].wasCold, false);
});

test("exactly four hours is warm and anything greater is cold", () => {
  const exactBoundary = computeSwitchCost([
    { ventureId: "alpha", timestamp: 0 },
    { ventureId: "beta", timestamp: hour },
    { ventureId: "alpha", timestamp: 4 * hour },
  ]);
  const overBoundary = computeSwitchCost([
    { ventureId: "alpha", timestamp: 0 },
    { ventureId: "beta", timestamp: hour },
    { ventureId: "alpha", timestamp: 4 * hour + 1 },
  ]);

  assert.equal(exactBoundary.timeline[1].wasCold, false);
  assert.equal(overBoundary.timeline[1].wasCold, true);
});

test("events are sorted without mutation and equal timestamps preserve caller order", () => {
  const events: SwitchEvent[] = [
    { ventureId: "gamma", timestamp: 2 * hour },
    { ventureId: "alpha", timestamp: 0 },
    { ventureId: "beta", timestamp: hour },
    { ventureId: "delta", timestamp: hour },
  ];
  const snapshot = structuredClone(events);

  const result = computeSwitchCost(events);

  assert.deepEqual(events, snapshot);
  assert.deepEqual(
    result.timeline.map((entry) => entry.ventureId),
    ["beta", "delta", "gamma"],
  );
});

test("malformed event input is rejected with its original index", () => {
  assert.throws(
    () => computeSwitchCost([{ ventureId: " ", timestamp: 0 }]),
    /index 0.*non-empty ventureId/,
  );
  assert.throws(
    () => computeSwitchCost([{ ventureId: "alpha", timestamp: Number.NaN }]),
    /index 0.*finite timestamp/,
  );
});

test("assumptions are returned and can explicitly disable cold first entries", () => {
  const assumptions = {
    ...DEFAULT_SWITCH_COST_ASSUMPTIONS,
    firstEntryIsCold: false,
  };
  const result = computeSwitchCost(
    [
      { ventureId: "alpha", timestamp: 0 },
      { ventureId: "beta", timestamp: hour },
    ],
    assumptions,
  );

  assert.deepEqual(result.assumptions, assumptions);
  assert.equal(result.coldSwitches, 0);
  assert.equal(result.estimatedMinutes, 9);
});

test("summary uses the measured switch count and rounded estimate", () => {
  const result = computeSwitchCost([
    { ventureId: "alpha", timestamp: 0 },
    { ventureId: "beta", timestamp: hour },
  ]);

  assert.equal(
    formatCostSummary(result),
    "You switched ventures 1 time. Estimated re-orientation budget: 19 minutes (0.3 hours).",
  );
});
