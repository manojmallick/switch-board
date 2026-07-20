import assert from "node:assert/strict";
import test from "node:test";
import { zodTextFormat } from "openai/helpers/zod";

import { demoVentures } from "../../../src/logic/demo-ventures";
import {
  createDailyCloseoutRequest,
  DailyCloseoutEnvelopeSchema,
  DailyCloseoutNarrativeSchema,
} from "../../../src/logic/daily-closeout";
import { createSwitchSession } from "../../../src/logic/switch-session";
import { AI_CAPABILITY, POST } from "./route";

test("declares the narrate-only AI capability", () => {
  assert.equal(AI_CAPABILITY, "narrate");
});

function validRequest() {
  return createDailyCloseoutRequest(
    createSwitchSession(demoVentures[0].id, 1_000),
    demoVentures,
    2_000,
  );
}

test("missing credentials return a valid GPT-5.6-style mock closeout", async () => {
  const priorKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const response = await POST(
      new Request("http://localhost/api/daily-closeout", {
        method: "POST",
        body: JSON.stringify(validRequest()),
      }),
    );
    const body = DailyCloseoutEnvelopeSchema.parse(await response.json());

    assert.equal(response.status, 200);
    assert.equal(body.source, "mock");
    assert.match(body.notice ?? "", /GPT-5\.6-style mock.*no API call/i);
    assert.match(body.closeout.narrative, /no completion is inferred/i);
  } finally {
    if (priorKey) process.env.OPENAI_API_KEY = priorKey;
  }
});

test("malformed and oversized requests fail before provider access", async () => {
  const malformed = await POST(
    new Request("http://localhost/api/daily-closeout", {
      method: "POST",
      body: JSON.stringify({ totalSwitches: 2 }),
    }),
  );
  const oversized = await POST(
    new Request("http://localhost/api/daily-closeout", {
      method: "POST",
      body: "x".repeat(64_001),
    }),
  );

  assert.equal(malformed.status, 400);
  assert.equal(oversized.status, 413);
});

test("closeout schema converts to a strict structured-output format", () => {
  const format = zodTextFormat(DailyCloseoutNarrativeSchema, "daily_closeout");

  assert.equal(format.type, "json_schema");
  assert.equal(format.strict, true);
  assert.deepEqual(format.schema.required, ["narrative", "shutdownPrompt"]);
  assert.equal(format.schema.additionalProperties, false);
});
