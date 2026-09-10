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
      "Inject a claims-api database saturation incident with connection-pool telemetry, request traces and a correlated configuration rollout.",
    ready: true,
    incidentId: "INC-2417",
    signals: ["logs", "trace", "metrics", "deployment", "commit"],
    category: "availability",
  },
  {
    id: "retry-storm",
    title: "Cascading downstream failures",
    description:
      "Inject a retry amplification incident where document-service degradation cascades back through claims-api and increases request volume.",
    ready: true,
    incidentId: "INC-2424",
    signals: ["trace", "logs", "metrics", "deployment", "commit"],
    category: "dependency",
  },
];
