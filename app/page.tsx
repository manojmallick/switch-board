import { SwitchboardClient } from "@/app/components/switchboard-client";
import { demoVentures, summarizePortfolio } from "@/src/logic";

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
        <div
          className="read-only-badge"
          aria-label="Read-Only Guarantee: AI never changes tasks or sends anything"
        >
          <span aria-hidden="true" />
          <div>
            <strong>Read-Only Guarantee</strong>
            <small>AI never changes tasks or sends anything</small>
          </div>
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

      <SwitchboardClient ventures={demoVentures} />
    </main>
  );
}
