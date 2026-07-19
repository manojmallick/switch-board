import assert from "node:assert/strict";
import test from "node:test";

import { DEMO_WORKDAY_RESULT } from "./demo-workday";
import { explainSwitchCost } from "./measurement-explanation";
import { computeSwitchCost, DEFAULT_SWITCH_COST_ASSUMPTIONS } from "./switch-cost";

const hour = 60 * 60 * 1000;

test("explains every demo transition and preserves the estimator total", () => {
  const explanation = explainSwitchCost(DEMO_WORKDAY_RESULT);

  assert.equal(explanation.transitions.length, 6);
  assert.equal(explanation.contributionMinutes, 73.8);
  assert.equal(explanation.displayedMinutes, 74);
  assert.equal(explanation.transitions[0].classification, "first-entry");
  assert.equal(explanation.transitions[1].classification, "warm-return");
  assert.deepEqual(
    explanation.transitions.map((transition) => transition.costMinutes),
    [18.9, 9, 18.9, 9, 9, 9],
  );
});

test("explains the strict threshold boundary without reclassifying it", () => {
  const exact = explainSwitchCost(
    computeSwitchCost([
      { ventureId: "alpha", timestamp: 0 },
      { ventureId: "beta", timestamp: hour },
      { ventureId: "alpha", timestamp: 4 * hour },
    ]),
  );
  const over = explainSwitchCost(
    computeSwitchCost([
      { ventureId: "alpha", timestamp: 0 },
      { ventureId: "beta", timestamp: hour },
      { ventureId: "alpha", timestamp: 4 * hour + 1 },
    ]),
  );

  assert.equal(exact.transitions[1].classification, "warm-return");
  assert.match(exact.transitions[1].reason, /exactly 240 minutes.*strict/);
  assert.equal(over.transitions[1].classification, "cold-return");
  assert.match(over.transitions[1].reason, /more than the 240 minutes cold threshold/);
});

test("uses the configured first-entry rule and produces no invented zero-state rows", () => {
  const empty = explainSwitchCost(computeSwitchCost([]));
  const baseFirstEntry = explainSwitchCost(
    computeSwitchCost(
      [
        { ventureId: "alpha", timestamp: 0 },
        { ventureId: "beta", timestamp: hour },
      ],
      { ...DEFAULT_SWITCH_COST_ASSUMPTIONS, firstEntryIsCold: false },
    ),
  );

  assert.deepEqual(empty.transitions, []);
  assert.equal(empty.contributionMinutes, 0);
  assert.equal(baseFirstEntry.transitions[0].classification, "first-entry");
  assert.equal(baseFirstEntry.transitions[0].costMinutes, 9);
  assert.match(baseFirstEntry.transitions[0].reason, /uses base cost/);
});
