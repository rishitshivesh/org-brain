import type {
  ArchitectureDecision,
  Commit,
  Deployment,
  Incident,
  IncidentContext,
  Repository,
  Service,
  ServiceContext,
  Trace,
  WorkItem,
  WorkItemContext,
} from "@/types/org-brain";
import type { OrgBrainProviders } from "@/providers/types";

export interface ChangeContext {
  deployment: Deployment;
  service: Service | null;
  repository: Repository | null;
  commits: Commit[];
  workItems: WorkItem[];
}

export interface WorkPlanningContext extends WorkItemContext {
  matchedBy: "id" | "search";
}

export interface IncidentInvestigationContext extends IncidentContext {
  traceServices: Service[];
  sourceChanges: Array<{
    commit: Commit;
    repository: Repository | null;
    files: string[];
  }>;
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export async function buildWorkPlanningContext(
  providers: OrgBrainProviders,
  workItemIdOrQuery: string,
): Promise<WorkPlanningContext | null> {
  const direct = await providers.workItems.getById(workItemIdOrQuery);
  const workItem = direct ?? (await providers.workItems.search(workItemIdOrQuery))[0];
  if (!workItem) return null;

  const allWorkItems = await providers.workItems.list();
  const services = (
    await Promise.all(
      (workItem.relatedServiceIds ?? []).map((serviceId) => providers.services.getById(serviceId)),
    )
  ).filter((service): service is Service => Boolean(service));
  const repositories = (
    await Promise.all(
      services
        .map((service) => service.repositoryId)
        .filter((id): id is string => Boolean(id))
        .map((repositoryId) => providers.repositories.getById(repositoryId)),
    )
  ).filter((repository): repository is Repository => Boolean(repository));
  const architectureDecisions = uniqueById(
    (
      await Promise.all(
        services.map((service) => providers.architecture.getForService(service.id)),
      )
    ).flat(),
  );

  return {
    matchedBy: direct ? "id" : "search",
    workItem,
    parent: workItem.parentId
      ? allWorkItems.find((item) => item.id === workItem.parentId)
      : undefined,
    children: allWorkItems.filter((item) => item.parentId === workItem.id),
    conflicts: allWorkItems.filter((item) => workItem.conflictsWith?.includes(item.id)),
    dependencies: allWorkItems.filter((item) => workItem.dependsOn?.includes(item.id)),
    services,
    repositories,
    architectureDecisions,
  };
}

export async function buildServiceContext(
  providers: OrgBrainProviders,
  serviceId: string,
): Promise<ServiceContext | null> {
  const service = await providers.services.getById(serviceId);
  if (!service) return null;

  const [dependencies, repository, deployments, allWorkItems, allIncidents, allServices] =
    await Promise.all([
      providers.services.getDependencies(serviceId),
      service.repositoryId
        ? providers.repositories.getById(service.repositoryId)
        : Promise.resolve(null),
      providers.deployments.getForService(serviceId),
      providers.workItems.list(),
      providers.incidents.list(),
      providers.services.list(),
    ]);

  return {
    service,
    repository: repository ?? undefined,
    team: undefined,
    upstreamServices: dependencies
      .filter((dependency) => dependency.to === serviceId)
      .map((dependency) => allServices.find((item) => item.id === dependency.from))
      .filter((item): item is Service => Boolean(item)),
    downstreamServices: dependencies
      .filter((dependency) => dependency.from === serviceId)
      .map((dependency) => allServices.find((item) => item.id === dependency.to))
      .filter((item): item is Service => Boolean(item)),
    deployments,
    workItems: allWorkItems.filter((item) => item.relatedServiceIds?.includes(serviceId)),
    incidents: allIncidents.filter((incident) => incident.affectedServiceIds.includes(serviceId)),
  };
}

export async function buildChangeContext(
  providers: OrgBrainProviders,
  deploymentId: string,
): Promise<ChangeContext | null> {
  const deployment = await providers.deployments.getById(deploymentId);
  if (!deployment) return null;

  const service = await providers.services.getById(deployment.serviceId);
  const repository = service?.repositoryId
    ? await providers.repositories.getById(service.repositoryId)
    : null;
  const commits = repository
    ? (
        await Promise.all(
          deployment.commitShas.map((sha) =>
            providers.repositories.getCommit(repository.id, sha),
          ),
        )
      ).filter((commit): commit is Commit => Boolean(commit))
    : [];
  const allWorkItems = await providers.workItems.list();
  const linkedIds = new Set(commits.flatMap((commit) => commit.workItemIds ?? []));

  return {
    deployment,
    service,
    repository,
    commits,
    workItems: allWorkItems.filter((item) => linkedIds.has(item.id)),
  };
}

export async function buildIncidentContext(
  providers: OrgBrainProviders,
  incidentId: string,
): Promise<IncidentInvestigationContext | null> {
  const incident = await providers.incidents.getById(incidentId);
  if (!incident) return null;

  const services = (
    await Promise.all(
      incident.affectedServiceIds.map((serviceId) => providers.services.getById(serviceId)),
    )
  ).filter((service): service is Service => Boolean(service));
  const traces = (
    await Promise.all(
      (incident.traceIds ?? []).map((traceId) => providers.observability.getTrace(traceId)),
    )
  ).filter((trace): trace is Trace => Boolean(trace));
  const traceServiceIds = new Set(traces.flatMap((trace) => trace.spans.map((span) => span.serviceId)));
  const traceServices = (
    await Promise.all([...traceServiceIds].map((serviceId) => providers.services.getById(serviceId)))
  ).filter((service): service is Service => Boolean(service));
  const deployments = (
    await Promise.all(
      (incident.correlatedDeploymentIds ?? []).map((id) => providers.deployments.getById(id)),
    )
  ).filter((deployment): deployment is Deployment => Boolean(deployment));
  const changes = (
    await Promise.all(deployments.map((deployment) => buildChangeContext(providers, deployment.id)))
  ).filter((change): change is ChangeContext => Boolean(change));
  const commits = changes.flatMap((change) => change.commits);
  const allWorkItems = await providers.workItems.list();
  const linkedWorkIds = new Set([
    ...(incident.workItemIds ?? []),
    ...commits.flatMap((commit) => commit.workItemIds ?? []),
  ]);
  const logs = (
    await Promise.all(traces.map((trace) => providers.observability.getLogsByTrace(trace.id)))
  ).flat();
  const metrics = (
    await Promise.all(traceServices.map((service) => providers.observability.getMetrics(service.id)))
  ).flat();
  const architectureDecisions: ArchitectureDecision[] = uniqueById(
    (
      await Promise.all(
        traceServices.map((service) => providers.architecture.getForService(service.id)),
      )
    ).flat(),
  );

  return {
    incident,
    services,
    traceServices,
    traces,
    deployments,
    commits,
    logs,
    metrics,
    workItems: allWorkItems.filter((item) => linkedWorkIds.has(item.id)),
    architectureDecisions,
    sourceChanges: changes.flatMap((change) =>
      change.commits.map((commit) => ({
        commit,
        repository: change.repository,
        files: commit.changedFiles ?? [],
      })),
    ),
  };
}
