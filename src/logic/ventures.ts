export type VentureKind = "company" | "partnership" | "independent";

export type VentureActivity = "active" | "idle" | "dormant";

export interface VentureNote {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
}

export interface VentureTask {
  readonly id: string;
  readonly title: string;
  readonly dueAt: string | null;
  readonly status: "pending" | "complete";
}

export interface Venture {
  readonly id: string;
  readonly name: string;
  readonly kind: VentureKind;
  readonly colorHex: `#${string}`;
  readonly activity: VentureActivity;
  readonly lastTouchedAt: string | null;
  readonly notes: readonly VentureNote[];
  readonly tasks: readonly VentureTask[];
}

export interface PortfolioSummary {
  readonly ventureCount: number;
  readonly activeVentureCount: number;
  readonly pendingTaskCount: number;
}

export function getPendingTaskCount(venture: Venture): number {
  return venture.tasks.filter((task) => task.status === "pending").length;
}

export function summarizePortfolio(ventures: readonly Venture[]): PortfolioSummary {
  return {
    ventureCount: ventures.length,
    activeVentureCount: ventures.filter((venture) => venture.activity === "active").length,
    pendingTaskCount: ventures.reduce(
      (total, venture) => total + getPendingTaskCount(venture),
      0,
    ),
  };
}
