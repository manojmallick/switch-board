"use client";

import { useMemo, useState, type CSSProperties } from "react";

import {
  computeSwitchCost,
  createSwitchSession,
  getPendingTaskCount,
  plugIntoVenture,
  resetSwitchSession,
  type Venture,
} from "@/src/logic";

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
  const measurement = useMemo(() => computeSwitchCost(session.events), [session.events]);
  const ventureNames = useMemo(
    () => new Map(ventures.map((venture) => [venture.id, venture.name])),
    [ventures],
  );

  function handlePlugIn(ventureId: string): void {
    setSession((current) => plugIntoVenture(current, ventureId, Date.now()).session);
  }

  function handleReset(): void {
    setSession((current) => resetSwitchSession(current, Date.now()));
  }

  return (
    <section className="board" aria-labelledby="board-title">
      <div className="board-heading">
        <div>
          <p className="eyebrow">Venture lines</p>
          <h2 id="board-title">Choose where your attention goes</h2>
        </div>
        <p>Usable switchboard · v0.3.0</p>
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
                onClick={() => handlePlugIn(venture.id)}
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
