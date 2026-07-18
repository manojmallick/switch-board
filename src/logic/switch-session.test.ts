import assert from "node:assert/strict";
import test from "node:test";

import { computeSwitchCost } from "./switch-cost";
import { createSwitchSession, plugIntoVenture, resetSwitchSession } from "./switch-session";

test("a session starts on one venture with zero measured switches", () => {
  const session = createSwitchSession("alpha", 100);

  assert.equal(session.activeVentureId, "alpha");
  assert.deepEqual(session.events, [{ ventureId: "alpha", timestamp: 100 }]);
  assert.equal(computeSwitchCost(session.events).totalSwitches, 0);
});

test("plugging into a different venture records exactly one timestamped event", () => {
  const original = createSwitchSession("alpha", 100);
  const result = plugIntoVenture(original, "beta", 200);

  assert.equal(result.eventLogged, true);
  assert.equal(result.session.activeVentureId, "beta");
  assert.deepEqual(result.session.events, [
    { ventureId: "alpha", timestamp: 100 },
    { ventureId: "beta", timestamp: 200 },
  ]);
  assert.equal(original.events.length, 1);
});

test("plugging into the active venture preserves the session and records nothing", () => {
  const session = createSwitchSession("alpha", 100);
  const result = plugIntoVenture(session, "alpha", 200);

  assert.equal(result.eventLogged, false);
  assert.equal(result.session, session);
  assert.equal(computeSwitchCost(result.session.events).estimatedMinutes, 0);
});

test("reset returns to the initial venture and clears measured switches", () => {
  const switched = plugIntoVenture(createSwitchSession("alpha", 100), "beta", 200).session;
  const reset = resetSwitchSession(switched, 300);

  assert.equal(reset.activeVentureId, "alpha");
  assert.deepEqual(reset.events, [{ ventureId: "alpha", timestamp: 300 }]);
  assert.equal(computeSwitchCost(reset.events).totalSwitches, 0);
});

test("invalid venture IDs and timestamps are rejected", () => {
  assert.throws(() => createSwitchSession(" ", 100), /non-empty ventureId/);
  assert.throws(() => createSwitchSession("alpha", Number.NaN), /finite timestamp/);
});
