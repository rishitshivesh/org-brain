import { buildIncidentContext } from "@/lib/context-builders";
import type { OrgBrainProviders } from "@/providers/types";

import type { AgentFinding, SpecialistAgentResult } from "./types";

const incidentPattern = /INC-\d+/i;

function minutesBetween(earlier: string, later: string): number {
  return Math.max(0, (Date.parse(later) - Date.parse(earlier)) / 60000);
}

function inspectSource(content: string): string[] {
  const normalized = content.replace(/\s+/g, " ").toLowerCase();
  const signals: string[] = [];

  if (normalized.includes("for (") && normalized.includes("await ")) {
    signals.push("awaited work inside a loop");
  }

  const poolMax = normalized.match(/max\s*:\s*(\d+)/)?.[1];
  if (poolMax && /pool|database/.test(normalized)) {
    signals.push(`database pool max configured to ${poolMax}`);
  }

  const retries = normalized.match(/retries\s*:\s*(\d+)/)?.[1];
  const minDelay = normalized.match(/mindelayms\s*:\s*(\d+)/)?.[1];
  const maxDelay = normalized.match(/maxdelayms\s*:\s*(\d+)/)?.[1];
  if (retries) {
    signals.push(
      `retry policy allows ${Number(retries) + 1} total attempts${minDelay !== undefined && maxDelay !== undefined ? ` with ${minDelay}-${maxDelay} ms delay` : ""}`,
    );
  }

  const wafThreshold = normalized.match(
    /anomaly[_\s-]*score[_\s-]*threshold\s*[:=]\s*(\d+)/,
  )?.[1];
  if (
    normalized.includes("request_body_inspection: strict") ||
    normalized.includes("multipart_form_data: inspect-all")
  ) {
    signals.push(
      `strict WAF multipart body inspection${wafThreshold ? ` with anomaly threshold ${wafThreshold}` : ""}`,
    );
  }

  const proxyReadTimeout = normalized.match(
    /proxy_read_timeout\s+(\d+)(ms|s|m)?/,
  );
  if (proxyReadTimeout) {
    const [, value, unit = "s"] = proxyReadTimeout;
    signals.push(`NGINX proxy read timeout configured to ${value}${unit}`);
  }

  return signals;
}

function scoreSignal(signal: string): number {
  if (signal === "awaited work inside a loop") return 35;
  if (signal.startsWith("database pool max")) return 30;
  if (signal.startsWith("retry policy allows")) return 35;
  if (signal.startsWith("strict WAF multipart body inspection")) return 35;
  if (signal.startsWith("NGINX proxy read timeout")) return 35;
  return 0;
}

export async function runChangeAgent(
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
  if (!context || context.deployments.length === 0) return null;

  const findings: AgentFinding[] = [];
  const sourceEvidence: Array<{
    commit: string;
    repository: string;
    path: string;
    signals: string[];
  }> = [];

  for (const deployment of context.deployments) {
    const change = context.sourceChanges.filter((item) =>
      deployment.commitShas.includes(item.commit.sha),
    );
    const deltaMinutes = minutesBetween(
      deployment.deployedAt,
      incident.startedAt,
    );

    for (const item of change) {
      let score = deltaMinutes <= 15 ? 30 : deltaMinutes <= 60 ? 20 : 5;
      const evidence = [
        `${deployment.id} deployed ${deltaMinutes.toFixed(0)} minutes before ${incident.id}`,
        `${item.commit.sha} · ${item.commit.message}`,
      ];

      if (
        /document|validat|database|pool|retry|timeout|waf|multipart|nginx|edge/i.test(
          item.commit.message,
        )
      ) {
        score += 15;
      }

      for (const path of item.files) {
        const snapshot = item.repository
          ? await providers.repositories.getSourceSnapshot(
              item.repository.id,
              item.commit.sha,
              path,
            )
          : null;
        if (!snapshot) continue;

        const signals = inspectSource(snapshot.content);
        sourceEvidence.push({
          commit: item.commit.sha,
          repository: item.repository?.name ?? item.commit.repositoryId,
          path,
          signals,
        });

        if (
          /document|validat|database|config|client|retry|nginx|waf|policy|claims-api/i.test(
            path,
          )
        ) {
          score += 10;
        }
        for (const signal of signals) {
          score += scoreSignal(signal);
          evidence.push(`${path}: ${signal}`);
        }
      }

      const affectedService = context.services.some(
        (service) => service.repositoryId === item.commit.repositoryId,
      );
      if (affectedService) score += 10;

      const confidence = Math.min(95, score);
      findings.push({
        id: `change-${item.commit.sha}`,
        title: `Candidate change ${item.commit.sha}`,
        description: `${item.repository?.name ?? item.commit.repositoryId} is temporally and structurally correlated with the incident.`,
        confidence,
        evidence,
        evidenceAgainst: [
          "The deployment completed successfully, so this is a behavioral or configuration regression rather than a failed rollout.",
        ],
      });
    }
  }

  findings.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  const strongest = findings[0];

  return {
    agent: "change",
    references: [
      incident.id,
      ...context.deployments.map((deployment) => deployment.id),
      ...context.commits.map((commit) => commit.sha),
    ],
    findings,
    tools: [
      {
        id: `deployments-${incident.id}`,
        name: "inspect_deployments",
        input: { incidentId: incident.id },
        output: {
          deployments: context.deployments.map((deployment) => ({
            id: deployment.id,
            serviceId: deployment.serviceId,
            version: deployment.version,
            deployedAt: deployment.deployedAt,
          })),
        },
      },
      {
        id: `commits-${incident.id}`,
        name: "inspect_commits",
        input: { incidentId: incident.id },
        output: {
          commits: context.commits.map((commit) => ({
            sha: commit.sha,
            message: commit.message,
            changedFiles: commit.changedFiles ?? [],
          })),
        },
      },
      {
        id: `source-${incident.id}`,
        name: "inspect_source_changes",
        input: { incidentId: incident.id },
        output: { files: sourceEvidence },
      },
      {
        id: `correlate-${incident.id}`,
        name: "correlate_change",
        input: { incidentId: incident.id },
        output: strongest
          ? {
              candidate: strongest.title,
              confidence: strongest.confidence,
              evidence: strongest.evidence,
            }
          : { candidate: null },
      },
    ],
    summary: strongest
      ? [
          "### Change Agent",
          "",
          `The strongest change candidate is **${strongest.title.replace("Candidate change ", "")}** at **${strongest.confidence}% confidence**.`,
          "",
          ...strongest.evidence.map((item) => `- ${item}`),
          "",
          "This is correlation from deployment, commit and source context. Final root-cause wording is left to the Synthesizer.",
        ].join("\n")
      : "### Change Agent\n\nNo source change could be correlated strongly enough from the seeded context.",
  };
}
