import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  buildReentryDataPrompt,
  createFallbackReentryBriefing,
  REENTRY_SYSTEM_INSTRUCTIONS,
  ReentryBriefingSchema,
  ReentryRequestSchema,
  type ReentryBriefingEnvelope,
} from "@/src/logic/reentry-briefing";

const MAX_REQUEST_BYTES = 64_000;
const DEFAULT_MODEL = "gpt-5.6-sol";

function fallbackEnvelope(
  input: Parameters<typeof createFallbackReentryBriefing>[0],
  notice: string,
): ReentryBriefingEnvelope {
  return {
    briefing: createFallbackReentryBriefing(input),
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

  const parsed = ReentryRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Request does not match the re-entry briefing contract." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      fallbackEnvelope(parsed.data, "Demo briefing: OPENAI_API_KEY is not configured."),
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const openai = new OpenAI({ apiKey, timeout: 12_000, maxRetries: 1 });
    const response = await openai.responses.parse({
      model,
      instructions: REENTRY_SYSTEM_INSTRUCTIONS,
      input: buildReentryDataPrompt(parsed.data),
      text: {
        format: zodTextFormat(ReentryBriefingSchema, "reentry_briefing"),
      },
    });

    if (!response.output_parsed) {
      return NextResponse.json(
        fallbackEnvelope(parsed.data, "AI returned no structured briefing; showing fallback."),
      );
    }

    return NextResponse.json({ briefing: response.output_parsed, source: "ai", model });
  } catch {
    return NextResponse.json(
      fallbackEnvelope(parsed.data, "AI briefing unavailable; showing deterministic fallback."),
    );
  }
}
