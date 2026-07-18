# Switchboard

Switchboard is a calm command center for people operating across multiple ventures. The
v0.1.0 foundation renders a typed, fictional portfolio without requiring a database or an
OpenAI API key.

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

## v0.1.0 scope

- Reproducible Next.js and TypeScript scaffold
- Typed venture, note, and task domain models
- Three explicitly fictional demo ventures
- Credential-free foundation screen
- CI gates for linting, types, tests, and production build
- Environment template with no secrets

Interactive switching, persistence, AI briefings, and switch-cost measurement are intentionally
reserved for later versions.

## Project structure

- `app/` — Next.js routes, presentation, and global styles
- `src/logic/` — application domain models, fixtures, and tests
- `lib/seo/` — shared metadata helpers from the universal scaffold
- `SWITCHBOARD_PRODUCTIVITY_PLAN.md` — product and submission plan

The project was generated with the local `create-universal-app` `web-nextjs` platform. Deploy,
SEO, CI, and SigMap wiring are included. Vercel configuration lives in `vercel.ts`.
