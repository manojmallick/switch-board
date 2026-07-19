import assert from "node:assert/strict";
import test from "node:test";
import { zodTextFormat } from "openai/helpers/zod";

import { demoVentures } from "../../../src/logic/demo-ventures";
import {
  createReentryRequest,
  ReentryBriefingSchema,
  ReentryBriefingEnvelopeSchema,
} from "../../../src/logic/reentry-briefing";
import { POST } from "./route";

test("missing credentials return a valid deterministic fallback envelope", async () => {
  const priorKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const response = await POST(
      new Request("http://localhost/api/reentry-briefing", {
        method: "POST",
        body: JSON.stringify(createReentryRequest(demoVentures[0])),
      }),
    );
    const body = ReentryBriefingEnvelopeSchema.parse(await response.json());

    assert.equal(response.status, 200);
    assert.equal(body.source, "fallback");
    assert.equal(body.briefing.topPriorities.length, 3);
  } finally {
    if (priorKey) process.env.OPENAI_API_KEY = priorKey;
  }
});

test("malformed and oversized requests fail before provider access", async () => {
  const malformed = await POST(
    new Request("http://localhost/api/reentry-briefing", {
      method: "POST",
      body: JSON.stringify({ ventureName: "Incomplete" }),
    }),
  );
  const oversized = await POST(
    new Request("http://localhost/api/reentry-briefing", {
      method: "POST",
      body: "x".repeat(64_001),
    }),
  );

  assert.equal(malformed.status, 400);
  assert.equal(oversized.status, 413);
});

test("briefing schema converts to a strict structured-output format", () => {
  const format = zodTextFormat(ReentryBriefingSchema, "reentry_briefing");

  assert.equal(format.type, "json_schema");
  assert.equal(format.strict, true);
  assert.deepEqual(format.schema.required, ["sinceYouLeft", "topPriorities", "oneLineFocus"]);
  assert.equal(format.schema.additionalProperties, false);
});
