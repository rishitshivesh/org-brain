import seed from "@/data/seed/org-brain.seed.json";
import { extendedOrgBrainData } from "@/data/seed/org-brain.extended";
import type {
  ArchitectureDecision,
  Commit,
  Deployment,
  Incident,
  OrgBrainData,
  Repository,
  Service,
  ServiceDependency,
  Team,
  Trace,
  WorkItem,
} from "@/types/org-brain";

const base = seed as unknown as OrgBrainData;

export const orgBrainData: OrgBrainData = {
  ...base,
  teams: [...base.teams, ...(extendedOrgBrainData.teams ?? [])],
  repositories: [
    ...base.repositories,
    ...(extendedOrgBrainData.repositories ?? []),
  ],
  services: [...base.services, ...(extendedOrgBrainData.services ?? [])],
  serviceDependencies: [
    ...base.serviceDependencies,
    ...(extendedOrgBrainData.serviceDependencies ?? []),
  ],
  workItems: [...base.workItems, ...(extendedOrgBrainData.workItems ?? [])],
  commits: [...base.commits, ...(extendedOrgBrainData.commits ?? [])],
  sourceSnapshots: [
    ...base.sourceSnapshots,
    ...(extendedOrgBrainData.sourceSnapshots ?? []),
  ],
  deployments: [
    ...base.deployments,
    ...(extendedOrgBrainData.deployments ?? []),
  ],
  incidents: [...base.incidents, ...(extendedOrgBrainData.incidents ?? [])],
  traces: [...base.traces, ...(extendedOrgBrainData.traces ?? [])],
  logs: [...base.logs, ...(extendedOrgBrainData.logs ?? [])],
  metrics: [...base.metrics, ...(extendedOrgBrainData.metrics ?? [])],
  architectureDecisions: [
    ...base.architectureDecisions,
    ...(extendedOrgBrainData.architectureDecisions ?? []),
  ],
  relationships: [
    ...(base.relationships ?? []),
    ...(extendedOrgBrainData.relationships ?? []),
  ],
};

export const byId = <T extends { id: string }>(items: T[], id?: string) =>
  id ? items.find((item) => item.id === id) : undefined;

export const getTeam = (id?: string): Team | undefined =>
  byId(orgBrainData.teams, id);
export const getRepository = (id?: string): Repository | undefined =>
  byId(orgBrainData.repositories, id);
export const getService = (id?: string): Service | undefined =>
  byId(orgBrainData.services, id);
export const getWorkItem = (id?: string): WorkItem | undefined =>
  byId(orgBrainData.workItems, id);
export const getDeployment = (id?: string): Deployment | undefined =>
  byId(orgBrainData.deployments, id);
export const getIncident = (id?: string): Incident | undefined =>
  byId(orgBrainData.incidents, id);
export const getTrace = (id?: string): Trace | undefined =>
  byId(orgBrainData.traces, id);
export const getArchitectureDecision = (
  id?: string,
): ArchitectureDecision | undefined =>
  byId(orgBrainData.architectureDecisions, id);

export const getCommit = (sha?: string): Commit | undefined =>
  sha ? orgBrainData.commits.find((commit) => commit.sha === sha) : undefined;

export function getServiceDependencies(serviceId: string): ServiceDependency[] {
  return orgBrainData.serviceDependencies.filter(
    (dependency) =>
      dependency.from === serviceId || dependency.to === serviceId,
  );
}

export function getWorkItemServices(workItem: WorkItem): Service[] {
  return (workItem.relatedServiceIds ?? [])
    .map((id) => getService(id))
    .filter((service): service is Service => Boolean(service));
}

export function getWorkItemConflicts(workItem: WorkItem): WorkItem[] {
  return (workItem.conflictsWith ?? [])
    .map((id) => getWorkItem(id))
    .filter((item): item is WorkItem => Boolean(item));
}

export function getServiceDeployments(serviceId: string): Deployment[] {
  return orgBrainData.deployments.filter(
    (deployment) => deployment.serviceId === serviceId,
  );
}

export function getServiceIncidents(serviceId: string): Incident[] {
  return orgBrainData.incidents.filter((incident) =>
    incident.affectedServiceIds.includes(serviceId),
  );
}

export function getServiceWorkItems(serviceId: string): WorkItem[] {
  return orgBrainData.workItems.filter((workItem) =>
    workItem.relatedServiceIds?.includes(serviceId),
  );
}

export function getIncidentDeployments(incident: Incident): Deployment[] {
  return (incident.correlatedDeploymentIds ?? [])
    .map((id) => getDeployment(id))
    .filter((deployment): deployment is Deployment => Boolean(deployment));
}

export function getIncidentTraces(incident: Incident): Trace[] {
  return (incident.traceIds ?? [])
    .map((id) => getTrace(id))
    .filter((trace): trace is Trace => Boolean(trace));
}

export function getDeploymentCommits(deployment: Deployment): Commit[] {
  return deployment.commitShas
    .map((sha) => getCommit(sha))
    .filter((commit): commit is Commit => Boolean(commit));
}

export function getWorkSummary() {
  const conflicts = orgBrainData.workItems.filter(
    (item) => (item.conflictsWith?.length ?? 0) > 0,
  );
  return {
    total: orgBrainData.workItems.length,
    active: orgBrainData.workItems.filter((item) =>
      ["Active", "Investigating", "Proposed"].includes(item.state),
    ).length,
    conflicts: conflicts.length,
    services: new Set(
      orgBrainData.workItems.flatMap((item) => item.relatedServiceIds ?? []),
    ).size,
  };
}
