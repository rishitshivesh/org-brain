import {
  buildIncidentContext,
  buildServiceContext,
  buildWorkPlanningContext,
} from "@/lib/context-builders";
import type { OrgBrainProviders } from "@/providers/types";
import type { Service, ServiceDependency } from "@/types/org-brain";

import type { SpecialistAgentResult } from "./types";

const workItemPattern = /ADO-\d+/i;
const incidentPattern = /INC-\d+/i;

function findNamedService(
  services: Service[],
  query: string,
): Service | undefined {
  const normalized = query.toLowerCase();
  return services.find((service) =>
    normalized.includes(service.name.toLowerCase()),
  );
}

async function resolveStartingServices(
  providers: OrgBrainProviders,
  query: string,
): Promise<Service[]> {
  const services = await providers.services.list();
  const namedService = findNamedService(services, query);
  if (namedService) return [namedService];

  const workItemId = query.match(workItemPattern)?.[0].toUpperCase();
  if (workItemId) {
    const context = await buildWorkPlanningContext(providers, workItemId);
    if (context) return context.services;
  }

  const incidentId = query.match(incidentPattern)?.[0].toUpperCase();
  if (incidentId) {
    const context = await buildIncidentContext(providers, incidentId);
    if (context) return context.traceServices;
  }

  return [];
}

async function collectReachable(
  providers: OrgBrainProviders,
  startingServices: Service[],
  direction: "upstream" | "downstream",
  maxDepth = 3,
): Promise<{ services: Service[]; edges: ServiceDependency[] }> {
  const allServices = await providers.services.list();
  const visited = new Set(startingServices.map((service) => service.id));
  const reachable = new Map<string, Service>();
  const edges = new Map<string, ServiceDependency>();
  let frontier = startingServices.map((service) => service.id);

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth += 1) {
    const next = new Set<string>();

    for (const serviceId of frontier) {
      const dependencies = await providers.services.getDependencies(serviceId);
      for (const dependency of dependencies) {
        const matches =
          direction === "downstream"
            ? dependency.from === serviceId
            : dependency.to === serviceId;
        if (!matches) continue;

        const targetId =
          direction === "downstream" ? dependency.to : dependency.from;
        edges.set(
          `${dependency.from}:${dependency.to}:${dependency.protocol}`,
          dependency,
        );

        if (visited.has(targetId)) continue;
        visited.add(targetId);
        next.add(targetId);
        const target = allServices.find((service) => service.id === targetId);
        if (target) reachable.set(target.id, target);
      }
    }

    frontier = [...next];
  }

  return { services: [...reachable.values()], edges: [...edges.values()] };
}

export async function runDependencyAgent(
  providers: OrgBrainProviders,
  query: string,
): Promise<SpecialistAgentResult | null> {
  const startingServices = await resolveStartingServices(providers, query);
  if (startingServices.length === 0) return null;

  const [upstream, downstream] = await Promise.all([
    collectReachable(providers, startingServices, "upstream"),
    collectReachable(providers, startingServices, "downstream"),
  ]);

  const startNames = startingServices.map((service) => service.name);
  const blastRadius = downstream.services.map((service) => service.name);
  const upstreamNames = upstream.services.map((service) => service.name);
  const allEdges = [...upstream.edges, ...downstream.edges];

  return {
    agent: "dependency",
    references: [
      ...startingServices.map((service) => service.id),
      ...upstream.services.map((service) => service.id),
      ...downstream.services.map((service) => service.id),
    ],
    findings: [
      {
        id: `dependency-${startingServices.map((service) => service.id).join("-")}`,
        title: `Dependency impact for ${startNames.join(", ")}`,
        description: `${blastRadius.length} downstream and ${upstreamNames.length} upstream services are reachable within three hops.`,
        confidence: 100,
        evidence: allEdges.map(
          (edge) =>
            `${edge.from} → ${edge.to} via ${edge.protocol}${edge.topic ? ` (${edge.topic})` : ""}`,
        ),
      },
    ],
    tools: [
      {
        id: `dependency-graph-${startingServices[0].id}`,
        name: "resolve_dependency_graph",
        input: {
          serviceIds: startingServices.map((service) => service.id),
          maxDepth: 3,
        },
        output: {
          upstream: upstreamNames,
          downstream: blastRadius,
          edges: allEdges,
        },
      },
      {
        id: `blast-radius-${startingServices[0].id}`,
        name: "assess_blast_radius",
        input: { serviceIds: startingServices.map((service) => service.id) },
        output: {
          affectedServices: blastRadius,
          count: blastRadius.length,
        },
      },
    ],
    summary: [
      "### Dependency Agent",
      "",
      `Starting from **${startNames.join(", ")}**, I found **${blastRadius.length} downstream** and **${upstreamNames.length} upstream** services within three hops.`,
      "",
      `**Downstream blast radius:** ${blastRadius.join(", ") || "none"}.`,
      `**Upstream callers:** ${upstreamNames.join(", ") || "none"}.`,
      "",
      "This is resolved from explicit service edges only. No semantic inference is used for dependency reachability.",
    ].join("\n"),
  };
}
