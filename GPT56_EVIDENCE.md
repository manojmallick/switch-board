# GPT-5.6 and Codex evidence

This file identifies the OpenAI Build Week Codex session and ties its work to repository artifacts
that judges can reproduce.

## Provenance

| Field | Value |
|---|---|
| Codex `/feedback` session ID | `019f74c9-1371-75a3-976e-45923e093dde` |
| Session workspace | `/Users/manojmallick/Documents/switch-board` |
| Session purpose | Review the idea, plan versioned milestones, implement, verify, document, and deploy Switchboard |
| Public repository | <https://github.com/manojmallick/switch-board> |
| Deployed sandbox | <https://switch-board-vert.vercel.app> |
| Submission track | Work & Productivity |

The session ID is the competition-required provenance record. Git history supplies the public,
repository-verifiable implementation trail; it does not independently expose private model-routing
metadata.

## Precise GPT-5.6 contribution

GPT-5.6 in Codex was used to turn the product plan into the versioned implementation. The most
important bounded contribution was the measurement spine:

- `src/logic/switch-cost.ts` implements deterministic switch counting and estimated cost.
- `src/logic/demo-workday.ts` supplies a fixed, fictional workday fixture.
- `src/logic/measurement-explanation.ts` derives the visible assumptions and transition ledger.
- Tests define first-entry behavior, strict `> 4 hours` cold classification, non-mutation, and
  final whole-minute rounding.
- The planner lets AI propose order, but validates identities and computes both baseline and
  proposal with the local estimator.

Codex then carried that decision through re-entry briefings, cross-venture ranking, daily closeout,
request and response schemas, read-only boundaries, CI, release gates, documentation, and the live
deployment.

## Decision trail

| Decision | Repository evidence |
|---|---|
| Replace an aspirational productivity headline with a measured fixture | `pnpm benchmark:switch-cost` and the `demo-workday` tests |
| Treat exactly four hours as warm | Boundary tests around four hours in `switch-cost.test.ts` |
| Keep AI from inventing planner savings | Planner validation plus local `computeSwitchCost` scoring |
| Keep assisted actions read-only | `src/logic/read-only-guarantee.ts` and its tests |
| Make the no-key experience honest | API mock envelopes and the visible `GPT-5.6 mock` source label |
| Fix reproducibility after the first CI failure | Commit `c39049c` pins the pnpm setup used by Actions |

## Public commit checkpoints

| Capability | Commit |
|---|---|
| Reproducible foundation | `611bd33` |
| Measurement spine | `6f0ceb7` |
| Usable switchboard | `58e65ec` |
| AI re-entry | `4fc4868` |
| Daily closeout | `418dffc` |
| Priority judging feature | `b13e5fd` |
| Judge demo workday | `9479ad0` |
| Switch-reduction planner | `6905822` |
| Measurement explanation | `5038ae3` |
| Submission candidate | `c267a61` |
| Honest credential-free GPT-5.6 mock labeling | `6d05cb4` |

## Reproduce the evidence

```bash
git clone https://github.com/manojmallick/switch-board.git
cd switch-board
corepack enable
pnpm install --frozen-lockfile
pnpm benchmark:switch-cost
pnpm verify
```

Expected fixture output includes `switchCount: 6`, `coldSwitchCount: 2`, and
`estimatedMinutesLost: 74`. These are estimator outputs, not a claim of scientifically measured
human productivity loss.

## Runtime disclosure

The code supports the OpenAI Responses API with `OPENAI_MODEL=gpt-5.6-sol` when a server-side key
is configured. The public deployment intentionally runs without `OPENAI_API_KEY`, so its assisted
cards use deterministic, highlighted `GPT-5.6 mock` data. The competition contribution being cited
is GPT-5.6's use inside Codex to build the project, proven by the `/feedback` session ID—not a claim
that the public mock is a live model response.
