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

## AI re-entry briefings

When a user plugs into a different venture, Switchboard requests a structured landing checklist
from the server-only OpenAI Responses API integration. The default model is `gpt-5.6-sol` and
can be changed with `OPENAI_MODEL`. See the [official model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-sol).

If credentials or the provider are unavailable, the API returns the same three-part contract
using a deterministic fallback. Venture notes are treated as untrusted data and the integration
never executes actions from generated content.

## v0.4.0 scope

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
- CI gates for linting, types, tests, and production build
- Environment template with no secrets

Persistence is intentionally reserved for later versions. v0.4.0 session data exists only in
the current browser tab and resets when the page reloads.

## Project structure

- `app/` — Next.js routes, presentation, and global styles
- `src/logic/` — application domain models, fixtures, and tests
- `scripts/` — deterministic benchmark entrypoints
- `lib/seo/` — shared metadata helpers from the universal scaffold
- `SWITCHBOARD_PRODUCTIVITY_PLAN.md` — product and submission plan

The project was generated with the local `create-universal-app` `web-nextjs` platform. Deploy,
SEO, CI, and SigMap wiring are included. Vercel configuration lives in `vercel.ts`.
