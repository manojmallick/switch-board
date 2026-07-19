import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  assertReadOnlyCapability,
  type ReadOnlyAiCapability,
} from "@/src/logic/read-only-guarantee";

import {
  buildPriorityMergeDataPrompt,
  createFallbackPriorityMerge,
  isCompletePriorityMerge,
  PRIORITY_MERGE_SYSTEM_INSTRUCTIONS,
  PriorityMergeRequestSchema,
  PriorityMergeResultSchema,
  type PriorityMergeEnvelope,
  type PriorityMergeRequest,
} from "@/src/logic/priority-merge";

const MAX_REQUEST_BYTES = 64_000;
const DEFAULT_MODEL = "gpt-5.6-sol";
export const AI_CAPABILITY = "rank" satisfies ReadOnlyAiCapability;

function fallbackEnvelope(input: PriorityMergeRequest, notice: string): PriorityMergeEnvelope {
  return {
    result: createFallbackPriorityMerge(input),
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

  const parsed = PriorityMergeRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Request does not match the priority merge contract." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      fallbackEnvelope(parsed.data, "Demo ranking: OPENAI_API_KEY is not configured."),
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    assertReadOnlyCapability(AI_CAPABILITY);
    const openai = new OpenAI({ apiKey, timeout: 12_000, maxRetries: 1 });
    const response = await openai.responses.parse({
      model,
      instructions: PRIORITY_MERGE_SYSTEM_INSTRUCTIONS,
      input: buildPriorityMergeDataPrompt(parsed.data),
      text: {
        format: zodTextFormat(PriorityMergeResultSchema, "priority_merge"),
      },
    });

    if (!response.output_parsed || !isCompletePriorityMerge(parsed.data, response.output_parsed)) {
      return NextResponse.json(
        fallbackEnvelope(parsed.data, "AI returned an incomplete ranking; showing fallback."),
      );
    }

    return NextResponse.json({ result: response.output_parsed, source: "ai", model });
  } catch {
    return NextResponse.json(
      fallbackEnvelope(parsed.data, "AI ranking unavailable; showing deterministic fallback."),
    );
  }
}
