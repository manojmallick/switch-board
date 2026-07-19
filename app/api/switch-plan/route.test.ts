import assert from "node:assert/strict";
import test from "node:test";
import { zodTextFormat } from "openai/helpers/zod";

import { demoVentures } from "../../../src/logic/demo-ventures";
import { createDemoWorkdaySession } from "../../../src/logic/demo-workday";
import {
  createSwitchPlannerRequest,
  SwitchPlannerEnvelopeSchema,
  SwitchPlannerProposalSchema,
} from "../../../src/logic/switch-planner";
import { POST } from "./route";

const input = createSwitchPlannerRequest(createDemoWorkdaySession(), demoVentures);

test("missing credentials return an independently scored fallback plan", async () => {
  const priorKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const response = await POST(
      new Request("http://localhost/api/switch-plan", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
    const body = SwitchPlannerEnvelopeSchema.parse(await response.json());

    assert.equal(response.status, 200);
    assert.equal(body.source, "fallback");
    assert.equal(body.result.baseline.estimatedMinutes, 74);
    assert.equal(body.result.proposed.estimatedMinutes, 38);
    assert.equal(body.result.projectedMinuteDifference, 36);
  } finally {
    if (priorKey) process.env.OPENAI_API_KEY = priorKey;
  }
});

test("malformed, insufficient, duplicate, and oversized requests fail before provider access", async () => {
  const malformed = await POST(
    new Request("http://localhost/api/switch-plan", {
      method: "POST",
      body: JSON.stringify({ baselineEvents: [], tasks: [] }),
    }),
  );
  const duplicate = await POST(
    new Request("http://localhost/api/switch-plan", {
      method: "POST",
      body: JSON.stringify({ ...input, tasks: [...input.tasks, input.tasks[0]] }),
    }),
  );
  const oversized = await POST(
    new Request("http://localhost/api/switch-plan", {
      method: "POST",
      body: "x".repeat(64_001),
    }),
  );

  assert.equal(malformed.status, 400);
  assert.equal(duplicate.status, 400);
  assert.equal(oversized.status, 413);
});

test("proposal schema converts to strict structured output without numeric claims", () => {
  const format = zodTextFormat(SwitchPlannerProposalSchema, "switch_reduction_plan");

  assert.equal(format.type, "json_schema");
  assert.equal(format.strict, true);
  assert.deepEqual(format.schema.required, ["blocks"]);
  assert.equal(format.schema.additionalProperties, false);
  assert.doesNotMatch(JSON.stringify(format.schema), /estimatedMinutes|Difference/);
});
