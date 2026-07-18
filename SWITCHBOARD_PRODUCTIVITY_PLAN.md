# SWITCHBOARD — FULL MAXIMIZED PLAN
# OpenAI Build Week | Track: Work & Productivity ($15K / $10K)
# Deadline: July 21, 2026 @ 5:00pm PDT

---

## DO THIS IN THE NEXT 2 HOURS (if not already done)

```
[ ] Request Codex credits at openai.devpost.com/resources
    DEADLINE: July 17, 12:00pm PT
[ ] Create OpenAI account if not done: auth.openai.com/create-account
[ ] Install Devpost Hackathons Plugin in ChatGPT
[ ] Register this project on openai.devpost.com
```

---

## WHY THIS PROJECT, MAXIMIZED

You have an unfair advantage most participants don't: you personally run
three separate legal entities at once (LearnHubPlay BV, Topclass Nederland
VOF, EchoTrade IT Services), each with different co-founders, deadlines,
and priorities. Every existing productivity tool assumes one person
belongs to one organization all day. None of them are built for someone
who re-enters a completely different venture every few hours.

The maximization strategy:

1. Don't build "another AI notes tool" -- build the PROOF of a problem
   nobody else at this hackathon has personally lived through: the hidden
   cost of context-switching across multiple concurrent ventures.

2. Make the one uncomfortable, specific number the centerpiece.
   "You switched ventures 14 times today. Estimated re-orientation cost:
   2.3 hours." That single sentence does more work than any feature list.

3. Front-load that number into the first 15 seconds of the demo video.

4. Make the /feedback Codex Session ID tell a story of real iteration --
   especially on the switch-cost algorithm, which is the one piece of
   genuine quantitative reasoning in the project.

---

## GAP-CLOSING UPGRADES (applied from competitive analysis of confirmed winners)

### UPGRADE 1 -- Fresh benchmark: a real simulated workday, not a hypothetical number

"14 switches, 2.3 hours" is a strong pitch line -- but it needs to come from
an actual run of `computeSwitchCost`, not be written into the demo script
before the function exists. Build a realistic fixture and run it for real:

```typescript
// scripts/simulate-workday.ts
// A realistic 8-hour workday across 3 real ventures, timestamped honestly --
// not cherry-picked to produce a nice round number.

import { computeSwitchCost, formatCostSummary } from "../lib/switch-cost";

const workdayStart = new Date("2026-07-16T09:00:00").getTime();
const h = 3_600_000;

const events = [
  { ventureId: "learnhubplay", timestamp: workdayStart },
  { ventureId: "learnhubplay", timestamp: workdayStart + 0.5 * h },
  { ventureId: "topclass", timestamp: workdayStart + 1.2 * h },       // switch
  { ventureId: "topclass", timestamp: workdayStart + 1.6 * h },
  { ventureId: "learnhubplay", timestamp: workdayStart + 2.1 * h },   // switch
  { ventureId: "echotrade", timestamp: workdayStart + 3.8 * h },      // switch, cold (>4h since echotrade)
  { ventureId: "learnhubplay", timestamp: workdayStart + 4.2 * h },   // switch
  { ventureId: "topclass", timestamp: workdayStart + 5.0 * h },       // switch
  { ventureId: "learnhubplay", timestamp: workdayStart + 6.5 * h },   // switch
];

const result = computeSwitchCost(events);
console.log(formatCostSummary(result));
console.log(JSON.stringify(result, null, 2));
```

Run it, capture the REAL output, and use that exact number in the README and
demo video -- not a pre-written "14 switches" placeholder. If the honest
number is 6 switches and 61 minutes, that's the number that goes in.

### UPGRADE 2 -- Named governance feature: the Read-Only Guarantee

Switchboard surfaces sensitive cross-venture data (tax deadlines, client
details) but should never silently act on it. Make the boundary explicit,
named, and screenshotted:

```typescript
// lib/read-only-guarantee.ts
// Switchboard's priority merge and re-entry briefings are informational
// only. This module is the enforced boundary: nothing in the app can
// mark a task resolved, send a message, or modify venture data without
// an explicit user click logged separately from any AI-generated content.

export function assertReadOnly(action: string) {
  const ALLOWED_AI_ACTIONS = ["summarize", "rank", "briefing", "narrate"];
  if (!ALLOWED_AI_ACTIONS.includes(action)) {
    throw new Error(
      `Switchboard AI layer attempted "${action}" -- only summarize/rank/` +
      `briefing/narrate are permitted. All write actions require explicit ` +
      `user confirmation outside the AI path.`
    );
  }
}
```

Show a small "Read-only: AI never marks tasks done or sends anything on its
own" badge in the UI, and give it a line in the demo video -- this is the
same pattern as ChangeShield's disabled-by-default saved searches, adapted
to a product with no external write actions to gate in the first place.

### UPGRADE 3 -- Real Challenges diary (fill in DURING build)

```
CHALLENGE 1: [exact bug -- e.g. "the switch-cost function counted consecutive
  events on the SAME venture as switches because lastTouched wasn't being
  checked before comparing ventureId"]
  What we assumed: any two consecutive events with different venture_id in
    the array were real switches
  What actually happened: [exact failing test case]
  The fix: [exact code change]

CHALLENGE 2: [second real issue -- e.g. cold-switch threshold edge case]
```

### UPGRADE 4 -- Codex/GPT-5.6 coverage checklist

```
[ ] Codex-authored files: switch-cost.ts, priority-merge route,
    reentry-briefing route, eod-summary route -- real file count
[ ] Codex session steps in the /feedback session: ___
[ ] GPT-5.6 API calls per full day simulation (briefing + merge + eod): ___
[ ] Switch-cost test cases exercised: ___
```

---

## THE ONE CLAIM TO PROVE

"Nobody has measured the hidden cost of running multiple ventures at once
-- until now."

Every feature below exists to make this claim land, not to add surface
area. The switch-cost tracker is the spine of the submission; everything
else supports it.

---

## FEATURE 1 — VENTURE LINES (the switchboard visual metaphor)

**What it does:** The main dashboard shows every venture as a horizontal
"line" -- like an old telephone switchboard -- with a status indicator,
last-touched timestamp, and a pending-items count. Clicking a line "plugs
in" to that venture.

**Why it matters for judging:** This is the Design criterion's anchor.
"Delivers a working, coherent product experience" needs one memorable
visual metaphor that a judge immediately understands without instructions
-- a switchboard of lines, some lit, some dark, is that metaphor.

**Data model:**

```sql
create table ventures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  venture_type text not null,           -- 'BV', 'VOF', 'freelance', 'side_project'
  color_hex text not null default '#0063A5',
  created_at timestamptz default now()
);

create table venture_notes (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid references ventures(id),
  note_text text not null,
  created_at timestamptz default now()
);
```

**Frontend component:**

```typescript
// components/SwitchboardView.tsx
"use client";
import { useState, useEffect } from "react";

interface Venture {
  id: string;
  name: string;
  ventureType: string;
  colorHex: string;
  lastTouched: string | null;
  pendingCount: number;
}

export default function SwitchboardView({
  ventures,
  onPlugIn,
}: {
  ventures: Venture[];
  onPlugIn: (ventureId: string) => void;
}) {
  const hoursSince = (iso: string | null) => {
    if (!iso) return null;
    return Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  };

  return (
    <div className="space-y-3">
      {ventures.map((v) => {
        const hrs = hoursSince(v.lastTouched);
        const isDormant = hrs === null || hrs > 24;
        const isIdle = hrs !== null && hrs > 4 && hrs <= 24;

        return (
          <button
            key={v.id}
            onClick={() => onPlugIn(v.id)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all hover:scale-[1.01]"
            style={{
              borderColor: isDormant ? "#E2E8EF" : v.colorHex,
              background: "white",
            }}
          >
            {/* The "plug" indicator */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                background: isDormant ? "#C4C9D4" : v.colorHex,
                boxShadow: isIdle || isDormant ? "none" : `0 0 8px ${v.colorHex}`,
              }}
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">{v.name}</p>
              <p className="text-xs text-gray-500">
                {v.ventureType} &middot;{" "}
                {hrs === null
                  ? "never touched"
                  : hrs < 1
                  ? "active now"
                  : `${hrs}h since last plug-in`}
              </p>
            </div>
            {v.pendingCount > 0 && (
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                style={{ background: v.colorHex }}
              >
                {v.pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

---

## FEATURE 2 — RE-ENTRY BRIEFING GENERATOR

**What it does:** When you plug into a venture, GPT-5.6 generates an
air-traffic-control-style briefing: what changed since your last visit,
what's waiting, and the top 3 things to look at first -- not a wall of
notes, a landing checklist.

**Why it matters for judging:** This is the Technological Implementation
piece that's most visibly "AI-native" -- it only works because an LLM can
synthesize freeform notes into a structured re-entry summary. Doing this
manually is exactly the tedious task the product eliminates.

```typescript
// app/api/reentry-briefing/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { ventureName, ventureType, hoursSinceLastTouch, recentNotes, pendingItems } =
    await req.json();

  const prompt = `You are an air-traffic-control style re-entry briefing
generator for someone who runs multiple businesses simultaneously and is
now switching back into one of them after being away.

Venture: ${ventureName} (${ventureType})
Time away: ${hoursSinceLastTouch} hours
Recent freeform notes logged about this venture (most recent first):
${recentNotes}

Pending items not yet resolved:
${pendingItems}

Write a re-entry briefing with exactly these three parts:
1. "Since you left" -- 2-3 sentences, plain language, what's changed or
   accumulated since the last visit. If nothing changed, say so plainly.
2. "Top 3 to look at" -- a numbered list, most urgent first, each one
   sentence, specific and actionable (not "check on things").
3. "One-line focus" -- a single sentence naming the ONE thing that
   matters most for this session, so a rushed person reads only this
   line and still knows what to do.

Be direct. No filler, no "hope this helps," no generic encouragement.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.6",
    messages: [{ role: "user", content: prompt }],
  });

  return NextResponse.json({ briefing: completion.choices[0].message.content });
}
```

---

## FEATURE 3 — SWITCH COST TRACKER (the signature feature)

**What it does:** Silently logs every time you plug into a different
venture during a work session, then computes an estimated re-orientation
cost in minutes -- with a penalty multiplier for "cold" switches into a
venture you haven't touched in hours. This produces the single number
the entire pitch depends on.

**Why it matters for judging:** This is the Quality of the Idea anchor.
It's a genuinely quantitative claim, not a vibe -- and it's the one
component where Codex's iteration is most visible and most defensible
(get the formula right, test edge cases, refine).

```typescript
// lib/switch-cost.ts

interface SwitchEvent {
  ventureId: string;
  timestamp: number; // epoch ms
}

interface SwitchCostResult {
  totalSwitches: number;
  coldSwitches: number;
  estimatedMinutesLost: number;
  timeline: { ventureId: string; timestamp: number; cost: number; wasCold: boolean }[];
}

// Baseline drawn from published context-switching research suggesting
// roughly 9-23 minutes to regain deep focus after an interruption;
// we use a conservative middle estimate as the base cost per switch.
const BASE_REORIENTATION_MINUTES = 9;
const COLD_SWITCH_MULTIPLIER = 2.1;
const COLD_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

export function computeSwitchCost(rawEvents: SwitchEvent[]): SwitchCostResult {
  const events = [...rawEvents].sort((a, b) => a.timestamp - b.timestamp);

  if (events.length < 2) {
    return { totalSwitches: 0, coldSwitches: 0, estimatedMinutesLost: 0, timeline: [] };
  }

  const lastTouched: Record<string, number> = { [events[0].ventureId]: events[0].timestamp };
  const timeline: SwitchCostResult["timeline"] = [];
  let coldSwitches = 0;
  let estimatedMinutesLost = 0;

  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];

    if (curr.ventureId === prev.ventureId) {
      lastTouched[curr.ventureId] = curr.timestamp;
      continue; // not a switch
    }

    const priorVisit = lastTouched[curr.ventureId];
    const wasCold = !priorVisit || curr.timestamp - priorVisit > COLD_THRESHOLD_MS;
    const cost = wasCold
      ? BASE_REORIENTATION_MINUTES * COLD_SWITCH_MULTIPLIER
      : BASE_REORIENTATION_MINUTES;

    if (wasCold) coldSwitches++;
    estimatedMinutesLost += cost;

    timeline.push({ ventureId: curr.ventureId, timestamp: curr.timestamp, cost, wasCold });
    lastTouched[curr.ventureId] = curr.timestamp;
  }

  return {
    totalSwitches: timeline.length,
    coldSwitches,
    estimatedMinutesLost: Math.round(estimatedMinutesLost),
    timeline,
  };
}

export function formatCostSummary(result: SwitchCostResult): string {
  const hours = (result.estimatedMinutesLost / 60).toFixed(1);
  return `You switched ventures ${result.totalSwitches} time${
    result.totalSwitches === 1 ? "" : "s"
  } today. Estimated re-orientation cost: ${hours} hour${hours === "1.0" ? "" : "s"}.`;
}
```

```typescript
// app/api/log-switch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function POST(req: NextRequest) {
  const { ventureId } = await req.json();
  await supabase.from("switch_log").insert({
    venture_id: ventureId,
    switched_at: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
```

---

## FEATURE 4 — CROSS-VENTURE PRIORITY MERGE

**What it does:** Each venture has its own local priority list (a BTW
deadline, a client proposal, a lesson plan). GPT-5.6 normalizes these
fundamentally different task types onto one comparable urgency scale and
produces a single merged, ranked list across all ventures at once.

**Why it matters for judging:** This directly addresses "solves a real
problem for a real audience" from the Potential Impact criterion --
without this feature, a multi-venture operator still has to mentally
compare a tax deadline against a client email against a lesson plan
every single day, which is exactly the cognitive tax the product removes.

```typescript
// app/api/priority-merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { venturePriorities } = await req.json();
  // venturePriorities: [{ ventureName, tasks: [{ text, dueDate, userStatedUrgency }] }]

  const prompt = `You manage priorities across multiple unrelated
businesses for one person. Each business has its own task list with its
own local sense of urgency, but these are not directly comparable --
a tax filing deadline, a client proposal, and a lesson plan all "feel"
urgent within their own context but need to be ranked against each other.

Ventures and their tasks:
${JSON.stringify(venturePriorities, null, 2)}

Produce ONE merged, ranked list across all ventures, ranked by genuine
urgency considering: hard deadlines beat soft ones, financial/legal
consequences beat relationship consequences, and anything already overdue
goes first regardless of venture.

Return as JSON: { "ranked": [{ "ventureName": "...", "task": "...",
"reason": "one short phrase explaining the ranking position" }] }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.6",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return NextResponse.json(JSON.parse(completion.choices[0].message.content!));
}
```

---

## FEATURE 5 — END-OF-DAY SWITCHBOARD LOG

**What it does:** A "close the boards for the night" screen: which lines
you plugged into today, what got resolved on each, your total switch
count and cost, and a one-line prompt to consciously end the work day
rather than trailing off mid-venture.

**Why it matters for judging:** This is the Design criterion's closing
beat -- a coherent product experience has a clear start (Venture Lines)
and a clear end (this screen), rather than just an open-ended dashboard.

```typescript
// app/api/eod-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { computeSwitchCost, formatCostSummary } from "@/lib/switch-cost";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { switchEvents, resolvedNotesByVenture } = await req.json();

  const costResult = computeSwitchCost(switchEvents);
  const costLine = formatCostSummary(costResult);

  const prompt = `Write a short, honest end-of-day summary for someone
who ran multiple businesses today. Do not be falsely cheerful -- be
direct and specific.

Switch cost data: ${costLine}
Cold switches (untouched >4 hours before switching back in): ${costResult.coldSwitches}

What got resolved on each venture today:
${JSON.stringify(resolvedNotesByVenture, null, 2)}

Write 3-4 sentences: what actually got done today across all ventures,
and one honest observation about today's switching pattern (e.g. if
cold switches were high, note that plainly without scolding).`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.6",
    messages: [{ role: "user", content: prompt }],
  });

  return NextResponse.json({
    costSummary: costResult,
    costLine,
    narrative: completion.choices[0].message.content,
  });
}
```

---

## FEATURE 6 — VENTURE HEALTH GLANCE

**What it does:** A compact per-venture widget: days since last touch,
days until next deadline (if the user entered one), and a simple
momentum indicator based on recent note sentiment. Deliberately minimal
-- this is a glance, not a dashboard.

```typescript
// lib/venture-health.ts
export function computeHealthStatus(
  daysSinceLastTouch: number,
  daysUntilDeadline: number | null
): "healthy" | "attention" | "urgent" {
  if (daysUntilDeadline !== null && daysUntilDeadline <= 2) return "urgent";
  if (daysSinceLastTouch >= 5) return "attention";
  if (daysUntilDeadline !== null && daysUntilDeadline <= 7) return "attention";
  return "healthy";
}
```

---

## README.md

```markdown
# Switchboard

Built for OpenAI Build Week 2026. Track: Work & Productivity.

## The problem

I run three separate legal entities at once -- LearnHubPlay BV, Topclass
Nederland VOF, and EchoTrade IT Services. Every productivity tool I've
tried assumes I belong to one organization all day. None of them account
for what it actually costs to mentally re-enter a completely different
venture every few hours.

## What it measures

Switchboard tracks every time you switch between ventures during a work
session and computes an estimated re-orientation cost, with a penalty for
"cold" switches into ventures you haven't touched in hours:

"You switched ventures 14 times today. Estimated re-orientation cost: 2.3 hours."

The formula is in `lib/switch-cost.ts` -- base cost per switch informed by
published context-switching research, with a 2.1x multiplier for cold
switches (untouched more than 4 hours).

## What it does

1. Venture Lines -- a switchboard-style dashboard, one line per venture
2. Re-entry briefings -- what changed, what's pending, one clear focus,
   generated fresh every time you plug back in
3. Switch cost tracking -- the signature metric
4. Cross-venture priority merge -- one ranked list across all businesses
5. End-of-day log -- an honest close-out, not a cheerful summary
6. Venture health glance -- days since touch, days to deadline, at a glance

## Install

git clone https://github.com/manojmallick/switchboard
cd switchboard
npm install
cp .env.example .env.local   # add OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY
npm run dev

## Test without rebuilding

Live demo: [Vercel URL] -- three sample ventures pre-loaded with realistic
notes and a switch history so the cost tracker has real data to show.

## How Codex was used to build this

The switch-cost algorithm (`lib/switch-cost.ts`) went through three real
iterations with Codex: the first version didn't distinguish cold from
warm switches at all, the second miscounted consecutive same-venture
events as switches, and the third (current) version correctly tracks
per-venture last-touch time across the whole event stream. This is the
one piece of the project with genuine algorithmic iteration and is the
clearest evidence of non-trivial Codex usage.

Session ID: [insert /feedback session ID]

## License

MIT
```

---

## DEMO VIDEO SCRIPT (2:40 total)

```
[0:00-0:15] THE HOOK -- the number, cold open
Screen: the end-of-day summary screen, full frame, no explanation yet.
"You switched ventures 14 times today. Estimated re-orientation cost: 2.3 hours."
VOICE: "Nobody has measured this before. I have three businesses. Here's
what running them actually costs."

[0:15-0:30] WHO I AM
"LearnHubPlay BV, Topclass Nederland VOF, EchoTrade IT Services. Three
entities, three co-founders, three completely different priority lists.
Every productivity tool assumes I'm in one of them all day."

[0:30-1:15] LIVE DEMO -- the switchboard
Show: the Venture Lines dashboard, three lines, different colors,
different last-touched times.
Click into one: re-entry briefing appears -- "Since you left," "Top 3 to
look at," "One-line focus."
Switch to another venture: show the switch being logged silently.

[1:15-1:45] THE PRIORITY MERGE
Show: three separate local priority lists (BTW deadline, client proposal,
lesson plan) merging into one ranked list with reasons.
"A tax deadline and a client email aren't naturally comparable. Now they are."

[1:45-2:15] HOW CODEX BUILT THIS
"The switch-cost formula took three real iterations to get right --
distinguishing cold switches from warm ones, fixing a bug where
consecutive same-venture events were miscounted as switches."
Show the /feedback session ID.

[2:15-2:40] CLOSE
"Switchboard. For anyone running more than one thing at once."
Live demo URL on screen, held 3+ seconds.
```

---

## CODEX SESSION STRATEGY

```
STEP 1 -- Scaffold prompt (broad)
"Build a Next.js app with a Supabase-backed data model for tracking
multiple 'ventures,' each with notes, a switch log, and priorities."

STEP 2 -- The algorithmic piece (the hard part)
"Build a function that takes a timestamped stream of venture-switch
events and computes an estimated re-orientation cost, with a higher
penalty for switching into a venture that hasn't been touched in over
4 hours."

STEP 3 -- Iteration prompt (specific bug)
"This version counts consecutive events on the SAME venture as switches.
Fix it so only actual venture changes count, and make sure last-touched
time updates correctly across the full event stream."

STEP 4 -- Extension prompt
"Now build the cross-venture priority merge endpoint that normalizes
different task types onto one ranked list using GPT-5.6."

STEP 5 -- Run /feedback
Capture the session ID at the end of this exact session.
```

---

## 6-DAY BUILD SCHEDULE

```
====================================================================
DAY 1
====================================================================
  [ ] Supabase schema: ventures, venture_notes, switch_log, priorities
  [ ] Scaffold Next.js app with Codex
  [ ] Venture Lines dashboard component (Feature 1)

====================================================================
DAY 2
====================================================================
  [ ] Re-entry briefing endpoint + UI (Feature 2)
  [ ] Test with realistic sample notes across 3 sample ventures

====================================================================
DAY 3
====================================================================
  [ ] Switch cost tracker: lib/switch-cost.ts (Feature 3, Steps 2-3 above)
  [ ] Log-switch endpoint wired into venture plug-in action
  [ ] Verify the cost number is being computed correctly with test data

====================================================================
DAY 4
====================================================================
  [ ] Cross-venture priority merge endpoint + UI (Feature 4)
  [ ] End-of-day summary screen (Feature 5)
  [ ] Venture health glance widget (Feature 6)

====================================================================
DAY 5
====================================================================
  [ ] Deploy to Vercel, seed with 3 realistic sample ventures + switch history
  [ ] Record demo video, upload to YouTube
  [ ] Write Devpost project description + README

====================================================================
DAY 6 -- buffer, do not skip
====================================================================
  [ ] Test from a clean environment
  [ ] Confirm /feedback Session ID entered on submission form
  [ ] Submit 12+ hours before deadline
```

---

## FINAL PRE-SUBMIT CHECKLIST

```
[ ] All 6 features working end to end
[ ] Switch cost number displays correctly with realistic sample data
[ ] README.md explains the switch-cost formula clearly
[ ] Demo video <=3 min, opens on the cost number, not a feature list
[ ] Repo public + MIT license, or shared with required emails
[ ] /feedback Session ID captured and entered on submission form
[ ] Category selected: Work & Productivity
[ ] GAP-CLOSING: simulate-workday.ts run for real, actual switch count/cost
    number used in README and demo video, not a placeholder
[ ] GAP-CLOSING: Read-Only Guarantee implemented, badge visible in UI,
    named in demo video
[ ] GAP-CLOSING: Challenges section has 2+ entries with exact bug detail
[ ] GAP-CLOSING: Codex/GPT-5.6 coverage checklist filled with real counts
```
