import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  buildSwitchPlannerDataPrompt,
  createFallbackSwitchPlan,
  evaluateSwitchPlan,
  isValidSwitchPlan,
  SWITCH_PLANNER_SYSTEM_INSTRUCTIONS,
  SwitchPlannerProposalSchema,
  SwitchPlannerRequestSchema,
  type SwitchPlannerEnvelope,
  type SwitchPlannerRequest,
} from "@/src/logic/switch-planner";

const MAX_REQUEST_BYTES = 64_000;
const DEFAULT_MODEL = "gpt-5.6-sol";

function fallbackEnvelope(input: SwitchPlannerRequest, notice: string): SwitchPlannerEnvelope {
  return {
    result: evaluateSwitchPlan(input, createFallbackSwitchPlan(input)),
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

  const parsed = SwitchPlannerRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Request does not match the switch planner contract." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      fallbackEnvelope(parsed.data, "Demo plan: OPENAI_API_KEY is not configured."),
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const openai = new OpenAI({ apiKey, timeout: 12_000, maxRetries: 1 });
    const response = await openai.responses.parse({
      model,
      instructions: SWITCH_PLANNER_SYSTEM_INSTRUCTIONS,
      input: buildSwitchPlannerDataPrompt(parsed.data),
      text: { format: zodTextFormat(SwitchPlannerProposalSchema, "switch_reduction_plan") },
    });

    if (!response.output_parsed || !isValidSwitchPlan(parsed.data, response.output_parsed)) {
      return NextResponse.json(
        fallbackEnvelope(parsed.data, "AI returned an invalid plan; showing grouped fallback."),
      );
    }

    return NextResponse.json({
      result: evaluateSwitchPlan(parsed.data, response.output_parsed),
      source: "ai",
      model,
    });
  } catch {
    return NextResponse.json(
      fallbackEnvelope(parsed.data, "AI planner unavailable; showing deterministic fallback."),
    );
  }
}
