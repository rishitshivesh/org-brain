import {
  buildIncidentContext,
  buildWorkPlanningContext,
} from "@/lib/context-builders";
import type { OrgBrainProviders } from "@/providers/types";
import type { ArchitectureDecision, Service } from "@/types/org-brain";

import type { SpecialistAgentResult } from "./types";

const workItemPattern = /ADO-\d+/i;
const incidentPattern = /INC-\d+/i;
const adrPattern = /ADR-\d+/i;

function findNamedService(services: Service[], query: string): Service | undefined {
  const normalized = query.toLowerCase();
  return services.find((service) => normalized.includes(service.name.toLowerCase()));
}

function uniqueDecisions(items: ArchitectureDecision[]): ArchitectureDecision[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export async function runKnowledgeAgent(
  providers: OrgBrainProviders,
  query: string,
): Promise<SpecialistAgentResult | null> {
  const allDecisions = await providers.architecture.list();
  const requestedAdr = query.match(adrPattern)?.[0].toUpperCase();
  let decisions: ArchitectureDecision[] = [];
  let scope = query;

  if (requestedAdr) {
    const decision = await providers.architecture.getById(requestedAdr);
    if (decision) decisions = [decision];
    scope = requestedAdr;
  }

  const workItemId = query.match(workItemPattern)?.[0].toUpperCase();
  if (decisions.length === 0 && workItemId) {
    const context = await buildWorkPlanningContext(providers, workItemId);
    if (context) {
      decisions = context.architectureDecisions;
      scope = context.workItem.id;
    }
  }

  const incidentId = query.match(incidentPattern)?.[0].toUpperCase();
  if (decisions.length === 0 && incidentId) {
    const context = await buildIncidentContext(providers, incidentId);
    if (context) {
      decisions = context.architectureDecisions;
      scope = context.incident.id;
    }
  }

  if (decisions.length === 0) {
    const services = await providers.services.list();
    const service = findNamedService(services, query);
    if (service) {
      decisions = await providers.architecture.getForService(service.id);
      scope = service.name;
    }
  }

  if (decisions.length === 0 && /architecture|adr|decision|constraint|knowledge/i.test(query)) {
    decisions = allDecisions;
    scope = "architecture knowledge";
  }

  decisions = uniqueDecisions(decisions);
  if (decisions.length === 0) return null;

  const accepted = decisions.filter((decision) => decision.status === "Accepted");
  const constraints = accepted.map(
    (decision) => `${decision.id} · ${decision.title}: ${decision.summary}`,
  );

  return {
    agent: "knowledge",
    references: decisions.map((decision) => decision.id),
    findings: decisions.map((decision) => ({
      id: `knowledge-${decision.id}`,
      title: decision.title,
      description: decision.summary,
      confidence: 100,
      evidence: [
        `${decision.id} is ${decision.status}`,
        ...(decision.relatedServiceIds?.map((serviceId) => `Applies to ${serviceId}`) ?? []),
        ...(decision.relatedWorkItemIds?.map((workItemId) => `Linked to ${workItemId}`) ?? []),
      ],
    })),
    tools: [
      {
        id: `knowledge-search-${scope}`,
        name: "inspect_architecture_decisions",
        input: { scope },
        output: {
          decisions: decisions.map((decision) => ({
            id: decision.id,
            title: decision.title,
            status: decision.status,
          })),
        },
      },
      {
        id: `knowledge-constraints-${scope}`,
        name: "check_architecture_constraints",
        input: { scope },
        output: { constraints },
      },
    ],
    summary: [
      "### Knowledge Agent",
      "",
      `I found **${decisions.length} architecture decision${decisions.length === 1 ? "" : "s"}** relevant to **${scope}**.`,
      "",
      ...(constraints.length ? constraints.map((constraint) => `- ${constraint}`) : ["- No accepted constraint found."]),
      "",
      "These are durable architecture constraints from the organization model, not recommendations generated for this query.",
    ].join("\n"),
  };
}
