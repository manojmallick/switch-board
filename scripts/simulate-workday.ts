import { computeSwitchCost, formatCostSummary, type SwitchEvent } from "../src/logic";

const workdayStart = new Date("2026-07-16T09:00:00.000Z").getTime();
const hour = 60 * 60 * 1000;

// A fixed, believable workday fixture. It is intentionally not tuned to a target headline.
const events: readonly SwitchEvent[] = [
  { ventureId: "demo-learning-lab", timestamp: workdayStart },
  { ventureId: "demo-learning-lab", timestamp: workdayStart + 0.5 * hour },
  { ventureId: "demo-advisory-co", timestamp: workdayStart + 1.2 * hour },
  { ventureId: "demo-advisory-co", timestamp: workdayStart + 1.6 * hour },
  { ventureId: "demo-learning-lab", timestamp: workdayStart + 2.1 * hour },
  { ventureId: "demo-systems-studio", timestamp: workdayStart + 3.8 * hour },
  { ventureId: "demo-learning-lab", timestamp: workdayStart + 4.2 * hour },
  { ventureId: "demo-advisory-co", timestamp: workdayStart + 5 * hour },
  { ventureId: "demo-learning-lab", timestamp: workdayStart + 6.5 * hour },
];

const result = computeSwitchCost(events);

console.log(formatCostSummary(result));
console.log(JSON.stringify(result, null, 2));
