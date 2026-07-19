# Switchboard

Switchboard is a calm command center for people operating across multiple ventures. The
application renders a typed, fictional portfolio without requiring a database or an OpenAI API
key and includes a deterministic measurement core for venture switches.

Built for OpenAI Build Week 2026 in the Work & Productivity track.

## Requirements

- Node.js 24
- pnpm 10

## Local setup

```bash
git clone https://github.com/manojmallick/switch-board.git
cd switch-board
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Environment values are optional for
the foundation preview; placeholders document integrations planned for later milestones.

## Verification

```bash
pnpm verify
```

The verification gate runs ESLint, TypeScript, the Node test suite, and a production Next.js
build. Run an individual command with `pnpm lint`, `pnpm typecheck`, `pnpm test`, or
`pnpm build`.

## Switch-cost measurement

Run the fixed eight-hour workday simulation:

```bash
pnpm benchmark:switch-cost
```

Its current honest result is **6 venture switches, 2 cold entries, and a 74-minute estimated
re-orientation budget**. The result comes directly from the checked-in fixture; it is not tuned
to reproduce a marketing placeholder.

The estimator uses transparent product assumptions: 9 minutes per switch, a 2.1× multiplier
for cold entries, and a cold threshold of more than four hours. A first entry into a venture not
seen in the supplied event history is cold; exactly four hours is warm. These values are an
adjustable planning model—not a scientific measurement of time actually lost.

## Judge demo workday

“Run demo workday” replays the same checked-in fictional event fixture used by
`pnpm benchmark:switch-cost`. It progresses through nine recorded entries using the normal
session state and `computeSwitchCost` path, finishing at the independently tested result of
**6 switches, 2 cold entries, and 74 estimated minutes**.

The completed replay exposes all six measured transitions and remains compatible with priority
merge and daily closeout. Replay and reset cancel prior progress, and manually plugging into a
venture leaves demo mode and starts a fresh current-time session.

## AI re-entry briefings

When a user plugs into a different venture, Switchboard requests a structured landing checklist
from the server-only OpenAI Responses API integration. The default model is `gpt-5.6-sol` and
can be changed with `OPENAI_MODEL`. See the [official model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-sol).

If credentials or the provider are unavailable, the API returns the same three-part contract
using a deterministic fallback. Venture notes are treated as untrusted data and the integration
never executes actions from generated content.

## Daily closeout

“Close the boards” turns the current in-tab session into an end-of-day snapshot: lines visited,
entry counts, remaining work, and the same switch/cold/cost measurement shown during the day.
The closeout does not add an event or infer that any task was completed.

The server requests a short, structured narrative through the same server-only Responses API
boundary as re-entry briefings. Missing credentials and provider failures produce a deterministic,
honest fallback, and “Start a fresh session” explicitly resets the local workday.

## Cross-venture priority merge

“Merge priorities” compares every pending task across the fictional venture lines and returns one
ranked list with a short reason for each position. The AI path must return every task exactly once
with its original identifier, venture, and title; incomplete or altered output is discarded.

Without credentials—or if the provider fails—the same UI uses deterministic deadline ordering:
earlier dated work first, undated work last, and source order as the stable tie-breaker. The ranking
is informational and never completes tasks, sends messages, or changes venture data.

## Switch-reduction planner

After a session reaches at least three measured switches, “Plan fewer switches” proposes a
read-only sequence of venture work blocks. GPT-5.6 may order the blocks, but it cannot supply
the projected metrics: Switchboard validates that every pending task appears exactly once under
its original venture, creates one-hour-spaced projected block events, and scores both sequences
through `computeSwitchCost`.

If credentials or the provider are unavailable, a deterministic fallback groups tasks by venture
in stable source order. For the fictional judge workday, the recorded baseline is 6 switches and
74 estimated minutes; the grouped counterfactual is 2 switches and 38 estimated minutes. The
36-minute difference is a projected planning estimate—not measured time saved—and the plan never
changes tasks, calendars, or the active session.

## Measurement explanation

The live estimate now includes a collapsed “Why?” disclosure derived from the same
`SwitchCostResult` shown in the session metrics. It states the base cost, cold multiplier,
strict greater-than-four-hour threshold, and first-entry behavior, then attributes a cost and
warm/cold reason to every measured transition. The contribution sum is shown before the final
whole-minute rounding step, so the fictional judge workday transparently shows 73.8 minutes
becoming the displayed 74-minute estimate. A zero-switch session never invents transition rows.

## v0.6.3 scope

- Reproducible Next.js and TypeScript scaffold
- Typed venture, note, and task domain models
- Three explicitly fictional demo ventures
- Credential-free foundation screen
- Pure, tested switch-cost estimator and per-switch timeline
- Reproducible simulated-workday benchmark with documented real output
- Interactive venture plug-in controls with one active line
- Duplicate-safe local session events and live switch-cost totals
- Recent warm/cold transition history and session reset
- Structured AI re-entry briefings on explicit venture switches
- Loading, provenance, stale-response protection, and deterministic fallback states
- Strict server validation and untrusted-data prompt isolation
- Explicit daily closeout with visited-line and remaining-work context
- Structured honest narrative with safe deterministic fallback
- Fresh-session action after consciously closing the boards
- Read-only cross-venture ranking of every pending task
- Explainable AI ordering with strict completeness validation
- Deterministic deadline fallback with stable tie-breaking
- One-click fictional judge workday using the shared benchmark fixture
- Progressive replay with full measured transition history, replay, and reset states
- Validated read-only venture-block planning after fragmented sessions
- Independently scored baseline/proposal comparison with deterministic fallback
- Accessible, collapsed measurement formula and per-transition explanation
- Explicit contribution sum and final display-rounding evidence
- CI gates for linting, types, tests, and production build
- Environment template with no secrets

Persistence is intentionally reserved for later versions. v0.6.3 session data exists only in
the current browser tab and resets when the page reloads.

## Project structure

- `app/` — Next.js routes, presentation, and global styles
- `src/logic/` — application domain models, fixtures, and tests
- `scripts/` — deterministic benchmark entrypoints
- `lib/seo/` — shared metadata helpers from the universal scaffold
- `SWITCHBOARD_PRODUCTIVITY_PLAN.md` — product and submission plan

The project was generated with the local `create-universal-app` `web-nextjs` platform. Deploy,
SEO, CI, and SigMap wiring are included. Vercel configuration lives in `vercel.ts`.
