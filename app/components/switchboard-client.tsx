"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";

import {
  computeSwitchCost,
  createDailyCloseoutRequest,
  createFallbackDailyCloseout,
  createFallbackPriorityMerge,
  createFallbackReentryBriefing,
  createPriorityMergeRequest,
  createReentryRequest,
  createSwitchSession,
  DailyCloseoutEnvelopeSchema,
  getPendingTaskCount,
  plugIntoVenture,
  PriorityMergeEnvelopeSchema,
  resetSwitchSession,
  ReentryBriefingEnvelopeSchema,
  type DailyCloseoutEnvelope,
  type DailyCloseoutRequest,
  type PriorityMergeEnvelope,
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

type CloseoutState =
  | { readonly status: "idle" }
  | { readonly status: "loading"; readonly request: DailyCloseoutRequest }
  | {
      readonly status: "ready";
      readonly request: DailyCloseoutRequest;
      readonly envelope: DailyCloseoutEnvelope;
    };

type PriorityState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly envelope: PriorityMergeEnvelope };

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
  const [closeoutState, setCloseoutState] = useState<CloseoutState>({ status: "idle" });
  const [priorityState, setPriorityState] = useState<PriorityState>({ status: "idle" });
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
    setCloseoutState({ status: "idle" });
    setPriorityState({ status: "idle" });
  }

  async function handleMergePriorities(): Promise<void> {
    const request = createPriorityMergeRequest(ventures, Date.now());
    setPriorityState({ status: "loading" });

    try {
      const response = await fetch("/api/priority-merge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error("Priority merge request failed.");

      const envelope = PriorityMergeEnvelopeSchema.parse(await response.json());
      setPriorityState({ status: "ready", envelope });
    } catch {
      setPriorityState({
        status: "ready",
        envelope: {
          result: createFallbackPriorityMerge(request),
          source: "fallback",
          notice: "Network ranking unavailable; showing local deadline order.",
        },
      });
    }
  }

  async function handleCloseBoards(): Promise<void> {
    const request = createDailyCloseoutRequest(session, ventures, Date.now());
    setCloseoutState({ status: "loading", request });

    try {
      const response = await fetch("/api/daily-closeout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error("Closeout request failed.");

      const envelope = DailyCloseoutEnvelopeSchema.parse(await response.json());
      setCloseoutState({ status: "ready", request, envelope });
    } catch {
      setCloseoutState({
        status: "ready",
        request,
        envelope: {
          closeout: createFallbackDailyCloseout(request),
          source: "fallback",
          notice: "Network closeout unavailable; showing local fallback.",
        },
      });
    }
  }

  function handleStartFreshSession(): void {
    handleReset();
  }

  return (
    <section className="board" aria-labelledby="board-title">
      <div className="board-heading">
        <div>
          <p className="eyebrow">Venture lines</p>
          <h2 id="board-title">Choose where your attention goes</h2>
        </div>
        <p>Priority merge · v0.6.0</p>
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
        <div className="session-actions">
          <button className="priority-merge-button" type="button" onClick={() => void handleMergePriorities()}>
            Merge priorities
          </button>
          <button className="reset-button" type="button" onClick={handleReset}>
            Reset session
          </button>
          <button className="close-boards-button" type="button" onClick={() => void handleCloseBoards()}>
            Close the boards
          </button>
        </div>
      </div>

      {priorityState.status !== "idle" ? (
        <section className="priority-screen" aria-labelledby="priority-title" aria-live="polite">
          <div className="priority-heading">
            <div>
              <p className="eyebrow">Across every line</p>
              <h3 id="priority-title">One priority signal</h3>
              <p>A read-only comparison of pending work—not an objective verdict.</p>
            </div>
            {priorityState.status === "ready" && (
              <span className={`briefing-source ${priorityState.envelope.source}`}>
                {priorityState.envelope.source === "ai" ? "AI ranking" : "Deadline fallback"}
              </span>
            )}
          </div>

          {priorityState.status === "loading" ? (
            <div className="briefing-loading" role="status">
              <span aria-hidden="true" />Comparing pending work across ventures…
            </div>
          ) : (
            <>
              <ol className="priority-ranking">
                {priorityState.envelope.result.ranked.map((item) => (
                  <li key={item.taskId}>
                    <strong>{item.position}</strong>
                    <div>
                      <span>{item.ventureName}</span>
                      <h4>{item.task}</h4>
                      <p>{item.reason}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {priorityState.envelope.notice && (
                <p className="priority-notice">{priorityState.envelope.notice}</p>
              )}
            </>
          )}

          <button className="back-board-button" type="button" onClick={() => setPriorityState({ status: "idle" })}>
            Back to the switchboard
          </button>
        </section>
      ) : closeoutState.status !== "idle" ? (
        <section className="closeout-screen" aria-labelledby="closeout-title" aria-live="polite">
          <div className="closeout-heading">
            <div>
              <p className="eyebrow">End of day</p>
              <h3 id="closeout-title">The boards are closing</h3>
            </div>
            {closeoutState.status === "ready" && (
              <span className={`briefing-source ${closeoutState.envelope.source}`}>
                {closeoutState.envelope.source === "ai" ? "AI closeout" : "Safe fallback"}
              </span>
            )}
          </div>

          <div className="closeout-metrics">
            <div><strong>{closeoutState.request.lines.length}</strong><span>lines visited</span></div>
            <div><strong>{closeoutState.request.totalSwitches}</strong><span>switches</span></div>
            <div><strong>{closeoutState.request.coldSwitches}</strong><span>cold</span></div>
            <div><strong>{closeoutState.request.estimatedMinutes}</strong><span>estimated min</span></div>
          </div>

          <div className="closeout-lines">
            {closeoutState.request.lines.map((line) => (
              <article key={line.ventureId}>
                <div><h4>{line.ventureName}</h4><span>{line.entries} {line.entries === 1 ? "entry" : "entries"}</span></div>
                <p>{line.pendingTasks.length} pending {line.pendingTasks.length === 1 ? "item" : "items"}</p>
              </article>
            ))}
          </div>

          {closeoutState.status === "loading" ? (
            <div className="briefing-loading" role="status"><span aria-hidden="true" />Preparing an honest closeout…</div>
          ) : (
            <div className="closeout-narrative">
              <p>{closeoutState.envelope.closeout.narrative}</p>
              <blockquote>{closeoutState.envelope.closeout.shutdownPrompt}</blockquote>
              {closeoutState.envelope.notice && <small>{closeoutState.envelope.notice}</small>}
            </div>
          )}

          <button className="fresh-session-button" type="button" onClick={handleStartFreshSession}>
            Start a fresh session
          </button>
        </section>
      ) : (
        <>
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
        </>
      )}
    </section>
  );
}
