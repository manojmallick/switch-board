import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  assertReadOnlyCapability,
  type ReadOnlyAiCapability,
} from "@/src/logic/read-only-guarantee";

import {
  buildDailyCloseoutDataPrompt,
  createFallbackDailyCloseout,
  DAILY_CLOSEOUT_SYSTEM_INSTRUCTIONS,
  DailyCloseoutNarrativeSchema,
  DailyCloseoutRequestSchema,
  type DailyCloseoutEnvelope,
  type DailyCloseoutRequest,
} from "@/src/logic/daily-closeout";

const MAX_REQUEST_BYTES = 64_000;
const DEFAULT_MODEL = "gpt-5.6-sol";
export const AI_CAPABILITY = "narrate" satisfies ReadOnlyAiCapability;

function fallbackEnvelope(input: DailyCloseoutRequest, notice: string): DailyCloseoutEnvelope {
  return {
    closeout: createFallbackDailyCloseout(input),
    source: "fallback",
    notice,
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  const body = await request.text();
  if (body.length > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  let rawInput: unknown;
  try {
    rawInput = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = DailyCloseoutRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Request does not match the daily closeout contract." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      fallbackEnvelope(parsed.data, "Demo closeout: OPENAI_API_KEY is not configured."),
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    assertReadOnlyCapability(AI_CAPABILITY);
    const openai = new OpenAI({ apiKey, timeout: 12_000, maxRetries: 1 });
    const response = await openai.responses.parse({
      model,
      instructions: DAILY_CLOSEOUT_SYSTEM_INSTRUCTIONS,
      input: buildDailyCloseoutDataPrompt(parsed.data),
      text: {
        format: zodTextFormat(DailyCloseoutNarrativeSchema, "daily_closeout"),
      },
    });

    if (!response.output_parsed) {
      return NextResponse.json(
        fallbackEnvelope(parsed.data, "AI returned no structured closeout; showing fallback."),
      );
    }

    return NextResponse.json({ closeout: response.output_parsed, source: "ai", model });
  } catch {
    return NextResponse.json(
      fallbackEnvelope(parsed.data, "AI closeout unavailable; showing deterministic fallback."),
    );
  }
}
