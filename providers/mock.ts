import { orgBrainData } from "@/lib/org-brain";
import type {
  ArchitectureDecision,
  ArchitectureDecisionId,
  Commit,
  CommitSha,
  Deployment,
  DeploymentId,
  Incident,
  IncidentId,
  ISODateString,
  LogEntry,
  MetricComparison,
  Repository,
  RepositoryId,
  Service,
  ServiceDependency,
  ServiceId,
  SourceSnapshot,
  Trace,
  TraceId,
  WorkItem,
  WorkItemDraft,
  WorkItemId,
} from "@/types/org-brain";
import type { OrgBrainProviders } from "@/providers/types";

const includes = (value: string | undefined, query: string) =>
  value?.toLowerCase().includes(query.toLowerCase()) ?? false;

export const mockProviders: OrgBrainProviders = {
  workItems: {
    async list(): Promise<WorkItem[]> {
      return orgBrainData.workItems;
    },
    async getById(id: WorkItemId): Promise<WorkItem | null> {
      return orgBrainData.workItems.find((item) => item.id === id) ?? null;
    },
    async search(query: string): Promise<WorkItem[]> {
      return orgBrainData.workItems.filter(
        (item) =>
          includes(item.id, query) ||
          includes(item.title, query) ||
          includes(item.description, query) ||
          item.tags?.some((tag) => includes(tag, query)) ||
          item.relatedServiceIds?.some((serviceId) =>
            includes(serviceId, query),
          ),
      );
    },
    async getRelated(id: WorkItemId): Promise<WorkItem[]> {
      const item = orgBrainData.workItems.find(
        (candidate) => candidate.id === id,
      );
      if (!item) return [];
      const relatedIds = new Set([
        ...(item.relatedWorkItemIds ?? []),
        ...(item.conflictsWith ?? []),
        ...(item.dependsOn ?? []),
        ...(item.blocks ?? []),
        ...(item.parentId ? [item.parentId] : []),
      ]);
      return orgBrainData.workItems.filter(
        (candidate) =>
          relatedIds.has(candidate.id) || candidate.parentId === item.id,
      );
    },
    async createDraft(input: WorkItemDraft): Promise<WorkItemDraft> {
      return input;
    },
  },
  repositories: {
    async list(): Promise<Repository[]> {
      return orgBrainData.repositories;
    },
    async getById(id: RepositoryId): Promise<Repository | null> {
      return (
        orgBrainData.repositories.find((repository) => repository.id === id) ??
        null
      );
    },
    async getCommit(
      repositoryId: RepositoryId,
      sha: CommitSha,
    ): Promise<Commit | null> {
      return (
        orgBrainData.commits.find(
          (commit) =>
            commit.repositoryId === repositoryId && commit.sha === sha,
        ) ?? null
      );
    },
    async getSourceSnapshot(
      repositoryId: RepositoryId,
      sha: CommitSha,
      path: string,
    ): Promise<SourceSnapshot | null> {
      return (
        orgBrainData.sourceSnapshots.find(
          (snapshot) =>
            snapshot.repositoryId === repositoryId &&
            snapshot.commitSha === sha &&
            snapshot.path === path,
        ) ?? null
      );
    },
  },
  services: {
    async list(): Promise<Service[]> {
      return orgBrainData.services;
    },
    async getById(id: ServiceId): Promise<Service | null> {
      return orgBrainData.services.find((service) => service.id === id) ?? null;
    },
    async getDependencies(id: ServiceId): Promise<ServiceDependency[]> {
      return orgBrainData.serviceDependencies.filter(
        (dependency) => dependency.from === id || dependency.to === id,
      );
    },
  },
  deployments: {
    async getById(id: DeploymentId): Promise<Deployment | null> {
      return (
        orgBrainData.deployments.find((deployment) => deployment.id === id) ??
        null
      );
    },
    async getForService(serviceId: ServiceId): Promise<Deployment[]> {
      return orgBrainData.deployments.filter(
        (deployment) => deployment.serviceId === serviceId,
      );
    },
    async getAroundTime(
      serviceId: ServiceId,
      timestamp: ISODateString,
    ): Promise<Deployment[]> {
      const center = new Date(timestamp).getTime();
      const windowMs = 24 * 60 * 60 * 1000;
      return orgBrainData.deployments.filter(
        (deployment) =>
          deployment.serviceId === serviceId &&
          Math.abs(new Date(deployment.deployedAt).getTime() - center) <=
            windowMs,
      );
    },
  },
  incidents: {
    async list(): Promise<Incident[]> {
      return orgBrainData.incidents;
    },
    async getById(id: IncidentId): Promise<Incident | null> {
      return (
        orgBrainData.incidents.find((incident) => incident.id === id) ?? null
      );
    },
  },
  observability: {
    async getTrace(id: TraceId): Promise<Trace | null> {
      return orgBrainData.traces.find((trace) => trace.id === id) ?? null;
    },
    async getLogsByTrace(id: TraceId): Promise<LogEntry[]> {
      return orgBrainData.logs.filter((log) => log.traceId === id);
    },
    async getLogsByService(
      serviceId: ServiceId,
      options?: { from?: ISODateString; to?: ISODateString },
    ): Promise<LogEntry[]> {
      return orgBrainData.logs.filter((log) => {
        if (log.serviceId !== serviceId) return false;
        const timestamp = new Date(log.timestamp).getTime();
        if (options?.from && timestamp < new Date(options.from).getTime())
          return false;
        if (options?.to && timestamp > new Date(options.to).getTime())
          return false;
        return true;
      });
    },
    async getMetrics(serviceId: ServiceId): Promise<MetricComparison[]> {
      return orgBrainData.metrics.filter(
        (metric) => metric.serviceId === serviceId,
      );
    },
  },
  architecture: {
    async list(): Promise<ArchitectureDecision[]> {
      return orgBrainData.architectureDecisions;
    },
    async getById(
      id: ArchitectureDecisionId,
    ): Promise<ArchitectureDecision | null> {
      return (
        orgBrainData.architectureDecisions.find(
          (decision) => decision.id === id,
        ) ?? null
      );
    },
    async getForService(serviceId: ServiceId): Promise<ArchitectureDecision[]> {
      return orgBrainData.architectureDecisions.filter((decision) =>
        decision.relatedServiceIds?.includes(serviceId),
      );
    },
  },
};
