export interface PublicScenarioDefinition {
  id: string;
  title: string;
  description: string;
  ready: boolean;
  incidentId?: string;
  signals: Array<"logs" | "trace" | "metrics" | "deployment" | "commit">;
  category: "latency" | "availability" | "dependency";
}

export const publicScenarios: PublicScenarioDefinition[] = [
  {
    id: "claims-latency",
    title: "Claims submission latency spike",
    description:
      "Inject a seeded production regression with correlated logs, traces, metrics, deployment and code context.",
    ready: true,
    incidentId: "INC-2409",
    signals: ["logs", "trace", "metrics", "deployment", "commit"],
    category: "latency",
  },
  {
    id: "database-pool",
    title: "Intermittent checkout timeouts",
    description:
      "Reserved fixture for the next dataset expansion. The UI is ready, the evidence pack is not fabricated yet.",
    ready: false,
    signals: ["logs", "metrics", "deployment"],
    category: "availability",
  },
  {
    id: "retry-storm",
    title: "Cascading downstream failures",
    description: "Reserved fixture for dependency and cascading-failure analysis.",
    ready: false,
    signals: ["trace", "logs", "metrics"],
    category: "dependency",
  },
];
