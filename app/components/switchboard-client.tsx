"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";

import {
  computeSwitchCost,
  createFallbackReentryBriefing,
  createReentryRequest,
  createSwitchSession,
  getPendingTaskCount,
  plugIntoVenture,
  resetSwitchSession,
  ReentryBriefingEnvelopeSchema,
  type ReentryBriefingEnvelope,
  type Venture,
} from "@/src/logic";

type BriefingState =
  | { readonly status: "idle" }
  | { readonly status: "loading"; readonly ventureName: string }
  | {
      readonly status: "ready";
      readonly ventureName: string;
      readonly envelope: ReentryBriefingEnvelope;
    };

function formatLastTouched(value: string | null): string {
  if (!value) return "Not touched yet";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

export function SwitchboardClient({ ventures }: { ventures: readonly Venture[] }) {
  const initialVenture = ventures.find((venture) => venture.activity === "active") ?? ventures[0];

  if (!initialVenture) {
    throw new Error("Switchboard requires at least one venture.");
  }

  const [session, setSession] = useState(() =>
    createSwitchSession(initialVenture.id, Date.now()),
  );
  const [briefingState, setBriefingState] = useState<BriefingState>({ status: "idle" });
  const briefingRequestId = useRef(0);
  const measurement = useMemo(() => computeSwitchCost(session.events), [session.events]);
  const ventureNames = useMemo(
    () => new Map(ventures.map((venture) => [venture.id, venture.name])),
    [ventures],
  );

  async function handlePlugIn(ventureId: string): Promise<void> {
    const venture = ventures.find((candidate) => candidate.id === ventureId);
    if (!venture) return;

    setSession((current) => plugIntoVenture(current, ventureId, Date.now()).session);
    const requestId = briefingRequestId.current + 1;
    briefingRequestId.current = requestId;
    setBriefingState({ status: "loading", ventureName: venture.name });

    const input = createReentryRequest(venture);

    try {
      const response = await fetch("/api/reentry-briefing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Briefing request failed.");

      const envelope = ReentryBriefingEnvelopeSchema.parse(await response.json());
      if (briefingRequestId.current === requestId) {
        setBriefingState({ status: "ready", ventureName: venture.name, envelope });
      }
    } catch {
      if (briefingRequestId.current === requestId) {
        setBriefingState({
          status: "ready",
          ventureName: venture.name,
          envelope: {
            briefing: createFallbackReentryBriefing(input),
            source: "fallback",
            notice: "Network briefing unavailable; showing local fallback.",
          },
        });
      }
    }
  }

  function handleReset(): void {
    briefingRequestId.current += 1;
    setSession((current) => resetSwitchSession(current, Date.now()));
    setBriefingState({ status: "idle" });
  }

  return (
    <section className="board" aria-labelledby="board-title">
      <div className="board-heading">
        <div>
          <p className="eyebrow">Venture lines</p>
          <h2 id="board-title">Choose where your attention goes</h2>
        </div>
        <p>AI re-entry · v0.4.0</p>
      </div>

      <div className="session-toolbar">
        <div className="session-metrics" aria-live="polite" aria-atomic="true">
          <div>
            <strong>{measurement.totalSwitches}</strong>
            <span>switches</span>
          </div>
          <div>
            <strong>{measurement.coldSwitches}</strong>
            <span>cold</span>
          </div>
          <div>
            <strong>{measurement.estimatedMinutes}</strong>
            <span>estimated min</span>
          </div>
        </div>
        <button className="reset-button" type="button" onClick={handleReset}>
          Reset session
        </button>
      </div>

      <div className="venture-list">
        {ventures.map((venture) => {
          const pendingCount = getPendingTaskCount(venture);
          const isActive = venture.id === session.activeVentureId;
          const lineState = isActive ? "active" : venture.activity === "dormant" ? "dormant" : "idle";

          return (
            <article className={`venture-card${isActive ? " connected" : ""}`} key={venture.id}>
              <div
                className={`line-indicator ${lineState}`}
                style={{ "--venture-color": venture.colorHex } as CSSProperties}
                aria-hidden="true"
              >
                <span />
              </div>
              <div className="venture-copy">
                <div className="venture-title-row">
                  <h3>{venture.name}</h3>
                  <span className={`status ${lineState}`}>
                    {isActive ? "On the line" : lineState === "dormant" ? "Needs a check-in" : "Waiting"}
                  </span>
                </div>
                <p>{venture.notes[0]?.text ?? "No updates are waiting."}</p>
                <div className="venture-meta">
                  <span>Last touched {formatLastTouched(venture.lastTouchedAt)}</span>
                  <span>{pendingCount} pending</span>
                </div>
              </div>
              <button
                className="plug-button"
                type="button"
                onClick={() => void handlePlugIn(venture.id)}
                disabled={isActive}
                aria-label={isActive ? `${venture.name} is connected` : `Plug into ${venture.name}`}
              >
                {isActive ? "Connected" : "Plug in"}
                <span aria-hidden="true">{isActive ? "●" : "→"}</span>
              </button>
            </article>
          );
        })}
      </div>

      <section className="briefing-panel" aria-labelledby="briefing-title" aria-live="polite">
        <div className="briefing-heading">
          <div>
            <p className="eyebrow">Landing checklist</p>
            <h3 id="briefing-title">Re-entry briefing</h3>
          </div>
          {briefingState.status === "ready" && (
            <span className={`briefing-source ${briefingState.envelope.source}`}>
              {briefingState.envelope.source === "ai" ? "AI briefing" : "Safe fallback"}
            </span>
          )}
        </div>

        {briefingState.status === "idle" && (
          <p className="briefing-empty">
            Plug into another venture to generate a concise re-entry checklist.
          </p>
        )}

        {briefingState.status === "loading" && (
          <div className="briefing-loading" role="status">
            <span aria-hidden="true" />
            Preparing the {briefingState.ventureName} briefing…
          </div>
        )}

        {briefingState.status === "ready" && (
          <div className="briefing-content">
            <p className="briefing-venture">Briefing for {briefingState.ventureName}</p>
            <div className="briefing-since">
              <h4>Since you left</h4>
              <p>{briefingState.envelope.briefing.sinceYouLeft}</p>
            </div>
            <div className="briefing-priorities">
              <h4>Top 3 to look at</h4>
              <ol>
                {briefingState.envelope.briefing.topPriorities.map((priority, index) => (
                  <li key={`${index}-${priority}`}>{priority}</li>
                ))}
              </ol>
            </div>
            <div className="briefing-focus">
              <span>One-line focus</span>
              <strong>{briefingState.envelope.briefing.oneLineFocus}</strong>
            </div>
            {briefingState.envelope.notice && (
              <p className="briefing-notice">{briefingState.envelope.notice}</p>
            )}
          </div>
        )}
      </section>

      <section className="switch-history" aria-labelledby="history-title">
        <div>
          <p className="eyebrow">Session signal</p>
          <h3 id="history-title">Recent transitions</h3>
        </div>
        {measurement.timeline.length === 0 ? (
          <p className="history-empty">No switches yet. Your current line is already connected.</p>
        ) : (
          <ol>
            {[...measurement.timeline]
              .reverse()
              .slice(0, 3)
              .map((entry, index) => (
                <li key={`${entry.timestamp}-${entry.ventureId}-${index}`}>
                  <span>
                    {ventureNames.get(entry.fromVentureId) ?? entry.fromVentureId}
                    <b aria-hidden="true">→</b>
                    {ventureNames.get(entry.ventureId) ?? entry.ventureId}
                  </span>
                  <em className={entry.wasCold ? "cold" : "warm"}>
                    {entry.wasCold ? "Cold entry" : "Warm return"} · {entry.costMinutes} min
                  </em>
                </li>
              ))}
          </ol>
        )}
      </section>
    </section>
  );
}
