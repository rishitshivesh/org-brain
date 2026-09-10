import {
  buildChangeContext,
  buildIncidentContext,
  buildServiceContext,
  buildWorkPlanningContext,
} from "@/lib/context-builders";
import type { OrgBrainProviders } from "@/providers/types";
import type { OrgBrainIntent, Service, WorkItem } from "@/types/org-brain";

export interface ResolvedOrgQuery {
  intent: OrgBrainIntent;
  answer: string;
  references: string[];
}

const workItemPattern = /ADO-\d+/i;
const incidentPattern = /INC-\d+/i;
const deploymentPattern = /DEP-\d+/i;

function list(items: string[]): string {
  return items.length
    ? items.map((item) => `- ${item}`).join("\n")
    : "- None found";
}

function getNamedService(
  services: Service[],
  query: string,
): Service | undefined {
  const normalized = query.toLowerCase();
  return services.find((service) =>
    normalized.includes(service.name.toLowerCase()),
  );
}

function workLabel(item: WorkItem): string {
  return `**${item.id}** · ${item.title}`;
}

export async function resolveOrgQuery(
  providers: OrgBrainProviders,
  rawQuery: string,
): Promise<ResolvedOrgQuery> {
  const query = rawQuery.trim();
  const normalized = query.toLowerCase();
  const workItemId = query.match(workItemPattern)?.[0].toUpperCase();
  const incidentId = query.match(incidentPattern)?.[0].toUpperCase();
  const deploymentId = query.match(deploymentPattern)?.[0].toUpperCase();
  const services = await providers.services.list();
  const namedService = getNamedService(services, query);

  if (
    incidentId ||
    normalized.includes("latency") ||
    normalized.includes("incident")
  ) {
    const incidents = await providers.incidents.list();
    const selectedIncident = incidentId
      ? await providers.incidents.getById(incidentId)
      : (incidents.find((incident) =>
          normalized.includes(incident.title.toLowerCase()),
        ) ?? incidents[0]);

    if (selectedIncident) {
      const context = await buildIncidentContext(
        providers,
        selectedIncident.id,
      );
      if (context) {
        const slowestSpans = context.traces
          .flatMap((trace) => trace.spans)
          .sort((a, b) => b.durationMs - a.durationMs)
          .slice(0, 3)
          .map((span) => {
            const service = context.traceServices.find(
              (item) => item.id === span.serviceId,
            );
            return `${service?.name ?? span.serviceId}: ${span.operation} · ${span.durationMs} ms`;
          });
        const changes = context.sourceChanges.map(
          ({ commit, repository }) =>
            `${repository?.name ?? commit.repositoryId} · ${commit.sha} · ${commit.message}`,
        );

        return {
          intent: "incident-investigation",
          references: [
            selectedIncident.id,
            ...context.traces.map((trace) => trace.id),
            ...context.deployments.map((deployment) => deployment.id),
            ...context.commits.map((commit) => commit.sha),
          ],
          answer: [
            `I resolved **${selectedIncident.id} · ${selectedIncident.title}** through the deterministic incident context.`,
            "",
            "**Affected services**",
            list(context.traceServices.map((service) => service.name)),
            "",
            "**Slowest trace spans**",
            list(slowestSpans),
            "",
            "**Correlated changes**",
            list(changes),
            "",
            `There are **${context.logs.length} correlated logs** and **${context.metrics.length} metric comparisons** available for the RCA stage. I have not inferred a root cause here; that remains agent work later.`,
          ].join("\n"),
        };
      }
    }
  }

  if (deploymentId) {
    const context = await buildChangeContext(providers, deploymentId);
    if (context) {
      return {
        intent: "impact-analysis",
        references: [
          deploymentId,
          ...context.commits.map((commit) => commit.sha),
        ],
        answer: [
          `**${deploymentId}** deployed **${context.service?.name ?? context.deployment.serviceId} ${context.deployment.version ?? ""}** to ${context.deployment.environment}.`,
          "",
          "**Commits**",
          list(
            context.commits.map(
              (commit) => `${commit.sha} · ${commit.message}`,
            ),
          ),
          "",
          "**Linked work**",
          list(context.workItems.map(workLabel)),
        ].join("\n"),
      };
    }
  }

  if (namedService) {
    const context = await buildServiceContext(providers, namedService.id);
    if (context) {
      return {
        intent: "service-analysis",
        references: [
          namedService.id,
          ...context.upstreamServices.map((service) => service.id),
          ...context.downstreamServices.map((service) => service.id),
        ],
        answer: [
          `**${namedService.name}** is a ${namedService.type} owned by **${namedService.ownerTeamId}**${context.repository ? ` and implemented in **${context.repository.name}**` : ""}.`,
          "",
          "**Upstream**",
          list(context.upstreamServices.map((service) => service.name)),
          "",
          "**Downstream**",
          list(context.downstreamServices.map((service) => service.name)),
          "",
          `It currently has **${context.workItems.length} linked work items**, **${context.deployments.length} seeded deployments**, and **${context.incidents.length} linked incidents**.`,
        ].join("\n"),
      };
    }
  }

  if (
    workItemId ||
    normalized.includes("partial settlement") ||
    normalized.includes("opd")
  ) {
    const context = await buildWorkPlanningContext(
      providers,
      workItemId ?? "partial settlement",
    );
    if (context) {
      return {
        intent: "work-planning",
        references: [
          context.workItem.id,
          ...context.conflicts.map((item) => item.id),
          ...context.architectureDecisions.map((decision) => decision.id),
        ],
        answer: [
          `I found ${workLabel(context.workItem)}.`,
          "",
          "**Affected services**",
          list(context.services.map((service) => service.name)),
          "",
          "**Conflicts**",
          list(context.conflicts.map(workLabel)),
          "",
          "**Architecture constraints**",
          list(
            context.architectureDecisions.map(
              (decision) =>
                `**${decision.id}** · ${decision.title}: ${decision.summary}`,
            ),
          ),
          "",
          "This result is assembled from explicit work-item, service and ADR relationships. No LLM inference is involved yet.",
        ].join("\n"),
      };
    }
  }

  return {
    intent: "general-query",
    references: [],
    answer: [
      "I can currently resolve deterministic organization questions around:",
      "",
      "- work-item impact and conflicts",
      "- service dependencies and ownership",
      "- incident → trace → deployment → commit context",
      "- deployment → commit → work-item context",
      "",
      "Try **ADO-4231**, **INC-2409**, **DEP-2198**, or ask about **claims-worker**.",
    ].join("\n"),
  };
}
