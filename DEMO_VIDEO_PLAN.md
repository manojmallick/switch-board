# Switchboard demo video plan

Target length: **2:50**. Hard limit: **under 3:00**. Publish on YouTube as **Public** and verify the
final URL in a signed-out window.

## Recording setup

- Record the deployed app at <https://switch-board-vert.vercel.app> in a clean browser window.
- Use 1080p, hide bookmarks and notifications, and keep browser zoom near 100%.
- Start from a fresh reload so the in-memory session is empty.
- Record voiceover with the screen capture. The rules require audio explaining both Codex and
  GPT-5.6 use.
- Do not call the highlighted mock a live GPT-5.6 response. Say “credential-free mock” on camera.

## Shot list and voiceover

| Time | Screen action | Voiceover target |
|---:|---|---|
| `0:00–0:12` | Show the full switchboard, then the empty measurement strip. | “Switchboard is a calm command center for people operating several ventures. It makes the hidden re-orientation cost of switching visible.” |
| `0:12–0:35` | Click **Run demo workday** and let the replay complete. | “This fixed fictional day runs through the same session code as normal interaction. It produces six switches, two cold entries, and a 74-minute planning estimate.” |
| `0:35–0:58` | Expand **Why 74 estimated minutes?** and point to assumptions and total. | “The number is measured from the fixture, not claimed. Every transition is inspectable; contributions total 73.8 minutes and round once to 74. Exactly four hours is warm—only more than four is cold.” |
| `0:58–1:20` | Switch to a venture and show its re-entry card/source badge. | “Re-entry turns notes and pending work into a structured briefing. This public deployment has no API key, so it honestly labels the deterministic GPT-5.6 mock. The real Responses API path is implemented server-side.” |
| `1:20–1:43` | Run **Merge priorities** and show the ranked cross-venture list. | “Priority merge keeps venture identity attached and validates that every pending task appears exactly once. If provider output fails validation, stable local ordering takes over.” |
| `1:43–2:07` | Run the switch-reduction planner; highlight baseline and proposal. | “AI may propose the block order, but it cannot claim the savings. Switchboard recomputes both schedules locally with the same estimator—here, the fallback groups the day from six switches and 74 minutes to two and 38.” |
| `2:07–2:24` | Trigger daily closeout and show the read-only guarantee. | “Closeout summarizes the same measured session. The AI boundary is read-only: briefing, ranking, planning, and narration only—no messages, scheduling, or task mutation.” |
| `2:24–2:44` | Show GitHub README’s Codex/GPT-5.6 section and evidence file. | “I used GPT-5.6 in Codex to review the idea, plan versioned milestones, implement and test the measurement spine, fix CI, document, and deploy. The required session ID and commit checkpoints are public in the repository.” |
| `2:44–2:50` | Return to app with live URL visible. | “Open the live sandbox—no account, key, or rebuild required.” |

## Required on-screen proof

- Live URL in the address bar.
- `6 switches`, `2 cold`, `74 estimated minutes` after replay.
- Expanded `73.8 → 74` explanation.
- Visible `GPT-5.6 mock` badge and the words “no API call” in narration.
- Planner baseline and proposal.
- README evidence section and session ID `019f74c9-1371-75a3-976e-45923e093dde`.

## YouTube metadata

**Title:** `Switchboard — Measure and reduce cross-venture context switching | OpenAI Build Week`

**Description:**

```text
Switchboard is a read-only command center that measures cross-venture context switching, explains
the estimate, and helps redesign a fragmented workday.

Live demo: https://switch-board-vert.vercel.app
Code and testing instructions: https://github.com/manojmallick/switch-board

Built with GPT-5.6 in Codex for OpenAI Build Week. The public credential-free demo clearly labels
deterministic GPT-5.6-style mock responses; the repository implements the real server-side OpenAI
Responses API path.
```

## Final checks before pasting the URL into Devpost

- Runtime is below `3:00` in YouTube's player.
- Visibility says **Public**, not Private or scheduled.
- Audio clearly says how Codex and GPT-5.6 were used.
- The app is shown working, not only slides.
- Open the YouTube URL in a signed-out/incognito window and play from beginning to end.
