import assert from "node:assert/strict";
import test from "node:test";
import { zodTextFormat } from "openai/helpers/zod";

import { demoVentures } from "../../../src/logic/demo-ventures";
import {
  createPriorityMergeRequest,
  isCompletePriorityMerge,
  PriorityMergeEnvelopeSchema,
  PriorityMergeResultSchema,
} from "../../../src/logic/priority-merge";
import { AI_CAPABILITY, POST } from "./route";

test("declares the rank-only AI capability", () => {
  assert.equal(AI_CAPABILITY, "rank");
});

const input = createPriorityMergeRequest(demoVentures, Date.parse("2026-07-19T09:00:00Z"));

test("missing credentials return a complete deterministic ranking", async () => {
  const priorKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const response = await POST(
      new Request("http://localhost/api/priority-merge", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
    const body = PriorityMergeEnvelopeSchema.parse(await response.json());

    assert.equal(response.status, 200);
    assert.equal(body.source, "fallback");
    assert.equal(isCompletePriorityMerge(input, body.result), true);
  } finally {
    if (priorKey) process.env.OPENAI_API_KEY = priorKey;
  }
});

test("malformed, duplicate, and oversized requests fail before provider access", async () => {
  const malformed = await POST(
    new Request("http://localhost/api/priority-merge", {
      method: "POST",
      body: JSON.stringify({ tasks: [] }),
    }),
  );
  const duplicate = await POST(
    new Request("http://localhost/api/priority-merge", {
      method: "POST",
      body: JSON.stringify({ ...input, tasks: [...input.tasks, input.tasks[0]] }),
    }),
  );
  const oversized = await POST(
    new Request("http://localhost/api/priority-merge", {
      method: "POST",
      body: "x".repeat(64_001),
    }),
  );

  assert.equal(malformed.status, 400);
  assert.equal(duplicate.status, 400);
  assert.equal(oversized.status, 413);
});

test("ranking schema converts to strict structured output", () => {
  const format = zodTextFormat(PriorityMergeResultSchema, "priority_merge");

  assert.equal(format.type, "json_schema");
  assert.equal(format.strict, true);
  assert.deepEqual(format.schema.required, ["ranked"]);
  assert.equal(format.schema.additionalProperties, false);
});
