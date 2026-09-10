import { buildIncidentContext } from "@/lib/context-builders";
import type { MetricComparison } from "@/types/org-brain";
import type { OrgBrainProviders } from "@/providers/types";

import type { SpecialistAgentResult } from "./types";

const incidentPattern = /INC-\d+/i;

function ratio(before: number, after: number): number {
  if (before === 0) return after === 0 ? 1 : Number.POSITIVE_INFINITY;
  return after / before;
}

function scopedMetrics(
  metrics: MetricComparison[],
  operations: string[],
): MetricComparison[] {
  const operationText = operations.join(" ").toLowerCase();

  if (/db\.|database|checkout/.test(operationText)) {
    return metrics.filter((metric) =>
      /^(db_|checkout_|cpu_|memory_)/.test(metric.metric),
    );
  }

  const repeatedAttempts = operations.filter((operation) =>
    /attempt=\d+/i.test(operation),
  ).length;
  if (repeatedAttempts >= 2) {
    return metrics.filter((metric) =>
      /^(document_|submit_|requests_|error_|cpu_|memory_)/.test(metric.metric),
    );
  }

  return metrics.filter((metric) =>
    /^(consumer_|cpu_|memory_)/.test(metric.metric),
  );
}

export async function runObservabilityAgent(
  providers: OrgBrainProviders,
  query: string,
): Promise<SpecialistAgentResult | null> {
  const requestedIncidentId = query.match(incidentPattern)?.[0].toUpperCase();
  const incidents = await providers.incidents.list();
  const incident = requestedIncidentId
    ? await providers.incidents.getById(requestedIncidentId)
    : (incidents[0] ?? null);

  if (!incident) return null;

  const context = await buildIncidentContext(providers, incident.id);
  if (!context) return null;

  const spans = context.traces.flatMap((trace) => trace.spans);
  const parentSpanIds = new Set(
    spans
      .map((span) => span.parentSpanId)
      .filter((id): id is string => Boolean(id)),
  );
  const leafSpans = spans.filter((span) => !parentSpanIds.has(span.id));
  const candidateSpans = leafSpans.length ? leafSpans : spans;
  const slowestSpans = [...candidateSpans]
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 3);
  const metrics = scopedMetrics(
    context.metrics,
    spans.map((span) => span.operation),
  );
  const anomalousMetrics = metrics
    .map((metric) => ({
      ...metric,
      change: ratio(metric.before, metric.after),
    }))
    .filter((metric) => metric.change >= 1.5)
    .sort((a, b) => b.change - a.change);
  const warningLogs = context.logs.filter(
    (log) => log.level === "warn" || log.level === "error",
  );

  const slowest = slowestSpans[0];
  const slowestService = slowest
    ? context.traceServices.find((service) => service.id === slowest.serviceId)
    : undefined;

  const bottleneck = slowest
    ? `${slowestService?.name ?? slowest.serviceId} · ${slowest.operation} (${slowest.durationMs} ms)`
    : "No trace bottleneck found";
  const evidence = [
    ...(slowest
      ? [
          `${slowestService?.name ?? slowest.serviceId} spent ${slowest.durationMs} ms in ${slowest.operation}`,
        ]
      : []),
    ...anomalousMetrics
      .slice(0, 3)
      .map(
        (metric) =>
          `${metric.metric} moved from ${metric.before}${metric.unit ?? ""} to ${metric.after}${metric.unit ?? ""} (${metric.change.toFixed(1)}×)`,
      ),
    ...warningLogs.slice(0, 2).map((log) => `${log.id}: ${log.message}`),
  ];
  const evidenceAgainst = metrics
    .filter(
      (metric) =>
        metric.metric.includes("cpu") || metric.metric.includes("memory"),
    )
    .filter((metric) => ratio(metric.before, metric.after) < 1.5)
    .map(
      (metric) =>
        `${metric.metric} stayed near baseline (${metric.before}${metric.unit ?? ""} → ${metric.after}${metric.unit ?? ""})`,
    );

  return {
    agent: "observability",
    references: [
      incident.id,
      ...context.traces.map((trace) => trace.id),
      ...warningLogs.map((log) => log.id),
    ],
    findings: [
      {
        id: `runtime-bottleneck-${incident.id}`,
        title: `Runtime bottleneck in ${slowestService?.name ?? "trace path"}`,
        description: bottleneck,
        confidence: slowest ? 92 : 55,
        evidence,
        evidenceAgainst,
      },
    ],
    tools: [
      {
        id: `trace-${incident.id}`,
        name: "inspect_trace",
        input: {
          incidentId: incident.id,
          traceIds: context.traces.map((trace) => trace.id),
        },
        output: {
          services: context.traceServices.map((service) => service.name),
          slowestSpans: slowestSpans.map((span) => ({
            service:
              context.traceServices.find(
                (service) => service.id === span.serviceId,
              )?.name ?? span.serviceId,
            operation: span.operation,
            durationMs: span.durationMs,
            status: span.status,
          })),
        },
      },
      {
        id: `logs-${incident.id}`,
        name: "inspect_logs",
        input: { incidentId: incident.id },
        output: {
          total: context.logs.length,
          warningsAndErrors: warningLogs.map((log) => ({
            id: log.id,
            level: log.level,
            message: log.message,
          })),
        },
      },
      {
        id: `metrics-${incident.id}`,
        name: "compare_metrics",
        input: {
          serviceIds: context.traceServices.map((service) => service.id),
        },
        output: {
          anomalies: anomalousMetrics.map((metric) => ({
            metric: metric.metric,
            before: metric.before,
            after: metric.after,
            unit: metric.unit,
            multiple: Number(metric.change.toFixed(1)),
          })),
        },
      },
    ],
    summary: [
      "### Observability Agent",
      "",
      `The strongest runtime bottleneck is **${bottleneck}**.`,
      "",
      anomalousMetrics.length
        ? `The largest metric shifts are ${anomalousMetrics
            .slice(0, 3)
            .map(
              (metric) =>
                `**${metric.metric}** ${metric.before}${metric.unit ?? ""} → ${metric.after}${metric.unit ?? ""} (${metric.change.toFixed(1)}×)`,
            )
            .join(", ")}.`
        : "No large metric regression was found in the seeded comparisons.",
      warningLogs.length
        ? `I also found **${warningLogs.length} warning/error logs** on the correlated trace.`
        : "No warning/error logs were correlated to the trace.",
      evidenceAgainst.length
        ? `Resource evidence that stayed near baseline: ${evidenceAgainst.join(", ")}.`
        : "",
      "",
      "This localizes the runtime problem. Source attribution is handled separately by the Change Agent.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
