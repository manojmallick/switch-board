# Switchboard v0.7.0 submission candidate

This document separates repository-verifiable evidence from submission work that still requires
a person or an external service. It is not a claim that the Devpost submission has been filed.

## Proven product claim

The checked-in fictional workday produces **6 venture switches, 2 cold entries, and a
74-minute estimated re-orientation budget**. The six transition contributions total 73.8
minutes before the estimator's final whole-minute rounding. Reproduce it with:

```bash
pnpm benchmark:switch-cost
```

The estimate is an explicit planning model—not a scientific measurement of productivity loss.
Its defaults are 9 minutes per switch, a 2.1× cold multiplier, a strict threshold of more than
four hours, and cold treatment for the first recorded entry into a venture.

## Product and AI coverage

- One deterministic measurement spine powers live metrics, demo replay, daily closeout,
  measurement explanation, and planner comparisons.
- Four user-triggered OpenAI Responses API paths are implemented: re-entry briefing, priority
  ranking, switch-reduction planning, and closeout narration.
- A full interaction can therefore make up to four AI requests; the demo replay itself makes
  none. Missing credentials or provider failures use deterministic fallbacks.
- Every AI path validates structured input and output. Ranking and planning additionally reject
  incomplete or identity-changing model output.
- The shared Read-Only Guarantee permits only `briefing`, `rank`, `plan`, and `narrate` at the
  provider boundary. It rejects write-like capabilities such as completing tasks, sending
  messages, scheduling events, or deleting notes.
- The repository history records the work as small issue-linked milestones from v0.1.0 through
  v0.7.0. The final Codex `/feedback` session identifier must be captured separately.

## Real implementation challenges

### 1. Reproducible CI needed an explicit pnpm version

The foundation workflow initially relied on package-manager inference. GitHub Actions could not
reliably select pnpm from that setup, so commit `c39049c` declared the pnpm version used by CI.
The same version is now pinned in `packageManager`, and the verification job installs from the
frozen lockfile.

### 2. The headline number had to follow the fixture

The early product plan used a hypothetical “14 switches / 2.3 hours” hook. Shipping that would
have made the demo stronger but the evidence weaker. The implementation introduced a fixed,
untuned eight-hour fixture and accepted its actual result: 6 switches and 74 minutes. The README,
demo strip, closeout, planner baseline, benchmark, and tests all use that result.

### 3. Boundary semantics and rounding needed to be inspectable

“Four hours” is ambiguous unless equality is defined, and 73.8 becoming 74 can look like a
discrepancy. The estimator defines cold as strictly greater than four hours, tests equality as
warm and one millisecond beyond as cold, and exposes every contribution plus final rounding in
the UI.

### 4. AI planning could not be allowed to invent the success metric

Having the model claim its own switch savings would make the comparison untrustworthy. The model
may only propose a complete venture-block ordering. Switchboard validates identities and then
computes both baseline and proposal through the deterministic estimator; invalid output falls
back to stable grouping.

## Suggested demo sequence (under three minutes)

1. Run the fictional workday and lead with **6 switches · 2 cold · 74 estimated minutes**.
2. Open “Why 74 estimated minutes?” to show the assumptions and 73.8 → 74 calculation.
3. Point out the Read-Only Guarantee, then show one re-entry briefing.
4. Show priority merge and the switch-reduction comparison (6 / 74 to 2 / 38 in fallback).
5. Close the boards on the same measured session.
6. End on the live URL and the Codex `/feedback` session identifier.

## Repository-ready checklist

- [x] Fictional demo works without credentials.
- [x] Benchmark output and visible demo number share one fixture.
- [x] Formula, boundary, per-transition costs, and rounding are explained.
- [x] AI inputs/outputs are validated and deterministic fallbacks exist.
- [x] Read-Only Guarantee is enforced and visible.
- [x] Test, type, lint, production-build, and CI gates exist.
- [x] MIT license is included.

## Manual submission checklist

- [ ] Deploy the final `main` commit and paste the public URL into Devpost.
- [ ] Test the public URL in a signed-out browser and on a phone.
- [ ] Record and upload a demo of no more than three minutes.
- [ ] Run `/feedback` and add the real Codex session identifier to Devpost.
- [ ] Select **Work & Productivity** and confirm all required Devpost fields.
- [ ] Verify the repository visibility and submit before the deadline.

