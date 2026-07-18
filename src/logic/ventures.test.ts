import assert from "node:assert/strict";
import test from "node:test";

import { demoVentures } from "./demo-ventures";
import { getPendingTaskCount, summarizePortfolio } from "./ventures";

test("demo fixtures use unique venture and nested record identifiers", () => {
  const ids = demoVentures.flatMap((venture) => [
    venture.id,
    ...venture.notes.map((note) => note.id),
    ...venture.tasks.map((task) => task.id),
  ]);

  assert.equal(new Set(ids).size, ids.length);
});

test("portfolio summary reflects fixture state", () => {
  assert.deepEqual(summarizePortfolio(demoVentures), {
    ventureCount: 3,
    activeVentureCount: 1,
    pendingTaskCount: 4,
  });
});

test("pending task count excludes completed work", () => {
  assert.equal(getPendingTaskCount(demoVentures[0]), 1);
});
