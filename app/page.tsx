import { demoVentures, getPendingTaskCount, summarizePortfolio } from "@/src/logic";

const activityLabels = {
  active: "On the line",
  idle: "Waiting",
  dormant: "Needs a check-in",
} as const;

function formatLastTouched(value: string | null): string {
  if (!value) return "Not touched yet";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

export default function Home() {
  const summary = summarizePortfolio(demoVentures);

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Your ventures, one clear signal</p>
          <h1>Switchboard</h1>
          <p className="intro">
            A calm place to see which venture is live, what is waiting, and where to plug in
            next.
          </p>
        </div>
        <div className="read-only-badge" aria-label="Demo data mode">
          <span aria-hidden="true" />
          Demo data · no credentials required
        </div>
      </header>

      <section className="summary-grid" aria-label="Portfolio summary">
        <div>
          <strong>{summary.ventureCount}</strong>
          <span>venture lines</span>
        </div>
        <div>
          <strong>{summary.activeVentureCount}</strong>
          <span>active now</span>
        </div>
        <div>
          <strong>{summary.pendingTaskCount}</strong>
          <span>pending items</span>
        </div>
      </section>

      <section className="board" aria-labelledby="board-title">
        <div className="board-heading">
          <div>
            <p className="eyebrow">Venture lines</p>
            <h2 id="board-title">Choose where your attention goes</h2>
          </div>
          <p>Measurement core · v0.2.0</p>
        </div>

        <div className="venture-list">
          {demoVentures.map((venture) => {
            const pendingCount = getPendingTaskCount(venture);

            return (
              <article className="venture-card" key={venture.id}>
                <div
                  className={`line-indicator ${venture.activity}`}
                  style={{ "--venture-color": venture.colorHex } as React.CSSProperties}
                  aria-hidden="true"
                >
                  <span />
                </div>
                <div className="venture-copy">
                  <div className="venture-title-row">
                    <h3>{venture.name}</h3>
                    <span className={`status ${venture.activity}`}>
                      {activityLabels[venture.activity]}
                    </span>
                  </div>
                  <p>{venture.notes[0]?.text ?? "No updates are waiting."}</p>
                  <div className="venture-meta">
                    <span>Last touched {formatLastTouched(venture.lastTouchedAt)}</span>
                    <span>{pendingCount} pending</span>
                  </div>
                </div>
                <button type="button" aria-label={`Plug into ${venture.name}`}>
                  Plug in
                  <span aria-hidden="true">→</span>
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
