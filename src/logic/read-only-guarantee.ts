export const READ_ONLY_AI_CAPABILITIES = Object.freeze([
  "briefing",
  "rank",
  "plan",
  "narrate",
] as const);

export type ReadOnlyAiCapability = (typeof READ_ONLY_AI_CAPABILITIES)[number];

const allowedCapabilities: ReadonlySet<string> = new Set(READ_ONLY_AI_CAPABILITIES);

/**
 * Enforces Switchboard's AI boundary before provider access.
 * AI may transform information, but it may not perform or request write actions.
 */
export function assertReadOnlyCapability(capability: string): asserts capability is ReadOnlyAiCapability {
  if (!allowedCapabilities.has(capability)) {
    throw new Error(
      `Read-Only Guarantee blocked AI capability "${capability}". ` +
        `Allowed capabilities: ${READ_ONLY_AI_CAPABILITIES.join(", ")}.`,
    );
  }
}
