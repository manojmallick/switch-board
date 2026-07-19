import assert from "node:assert/strict";
import test from "node:test";

import {
  createDemoWorkdaySession,
  DEMO_WORKDAY_EVENTS,
  DEMO_WORKDAY_RESULT,
} from "./demo-workday";
import { computeSwitchCost } from "./switch-cost";

test("shared demo fixture proves the documented honest result", () => {
  assert.equal(DEMO_WORKDAY_EVENTS.length, 9);
  assert.equal(DEMO_WORKDAY_RESULT.totalSwitches, 6);
  assert.equal(DEMO_WORKDAY_RESULT.coldSwitches, 2);
  assert.equal(DEMO_WORKDAY_RESULT.estimatedMinutes, 74);
  assert.deepEqual(computeSwitchCost(DEMO_WORKDAY_EVENTS), DEMO_WORKDAY_RESULT);
});

test("progressive sessions preserve fixture order and active venture", () => {
  const first = createDemoWorkdaySession(1);
  const middle = createDemoWorkdaySession(5);
  const complete = createDemoWorkdaySession();

  assert.deepEqual(first.events, DEMO_WORKDAY_EVENTS.slice(0, 1));
  assert.deepEqual(middle.events, DEMO_WORKDAY_EVENTS.slice(0, 5));
  assert.equal(middle.activeVentureId, DEMO_WORKDAY_EVENTS[4].ventureId);
  assert.deepEqual(complete.events, DEMO_WORKDAY_EVENTS);
  assert.notEqual(complete.events, DEMO_WORKDAY_EVENTS);
});

test("invalid demo steps are rejected without changing the fixture", () => {
  const original = [...DEMO_WORKDAY_EVENTS];

  assert.throws(() => createDemoWorkdaySession(0), /integer from 1/);
  assert.throws(() => createDemoWorkdaySession(1.5), /integer from 1/);
  assert.throws(() => createDemoWorkdaySession(DEMO_WORKDAY_EVENTS.length + 1), /integer from 1/);
  assert.deepEqual(DEMO_WORKDAY_EVENTS, original);
  assert.equal(Object.isFrozen(DEMO_WORKDAY_EVENTS), true);
});
