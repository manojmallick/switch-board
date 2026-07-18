import type { Venture } from "./ventures";

// Fictional records keep the public demo realistic without exposing client or company data.
export const demoVentures = [
  {
    id: "demo-learning-lab",
    name: "Demo Learning Lab",
    kind: "company",
    colorHex: "#F0A35E",
    activity: "active",
    lastTouchedAt: "2026-07-18T15:20:00.000Z",
    notes: [
      {
        id: "learning-note-1",
        text: "The pilot lesson review is ready for a final decision.",
        createdAt: "2026-07-18T14:45:00.000Z",
      },
    ],
    tasks: [
      {
        id: "learning-task-1",
        title: "Approve the pilot lesson outline",
        dueAt: "2026-07-20T15:00:00.000Z",
        status: "pending",
      },
      {
        id: "learning-task-2",
        title: "Send the facilitator checklist",
        dueAt: null,
        status: "complete",
      },
    ],
  },
  {
    id: "demo-advisory-co",
    name: "Demo Advisory Co.",
    kind: "partnership",
    colorHex: "#72C8B5",
    activity: "idle",
    lastTouchedAt: "2026-07-18T09:10:00.000Z",
    notes: [
      {
        id: "advisory-note-1",
        text: "Two proposal questions need answers before the client review.",
        createdAt: "2026-07-18T08:55:00.000Z",
      },
    ],
    tasks: [
      {
        id: "advisory-task-1",
        title: "Resolve proposal questions",
        dueAt: "2026-07-19T12:00:00.000Z",
        status: "pending",
      },
      {
        id: "advisory-task-2",
        title: "Confirm the quarterly filing owner",
        dueAt: "2026-07-21T09:00:00.000Z",
        status: "pending",
      },
    ],
  },
  {
    id: "demo-systems-studio",
    name: "Demo Systems Studio",
    kind: "independent",
    colorHex: "#7E92F5",
    activity: "dormant",
    lastTouchedAt: "2026-07-16T13:30:00.000Z",
    notes: [
      {
        id: "systems-note-1",
        text: "The deployment checklist is waiting for an owner.",
        createdAt: "2026-07-16T13:25:00.000Z",
      },
    ],
    tasks: [
      {
        id: "systems-task-1",
        title: "Assign the deployment checklist",
        dueAt: null,
        status: "pending",
      },
    ],
  },
] as const satisfies readonly Venture[];
