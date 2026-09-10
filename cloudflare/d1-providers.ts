import { orgBrainData } from "../lib/org-brain";
import type { OrgBrainProviders } from "../providers/types";
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
} from "../types/org-brain";
import type { Env } from "./env";

const ENTITY_TABLE = "org_entities";
let schemaReady = false;

interface EntityRow {
  entity_id: string;
  payload_json: string;
}

function parse<T>(row: EntityRow | null): T | null {
  if (!row?.payload_json) return null;
  return JSON.parse(row.payload_json) as T;
}

async function ensureSchema(env: Env): Promise<void> {
  if (!env.DB || schemaReady) return;
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS ${ENTITY_TABLE} (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (entity_type, entity_id)
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS provider_handoffs (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_org_entities_type
     ON ${ENTITY_TABLE}(entity_type)`,
  ).run();
  schemaReady = true;
}

function seedEntities() {
  return [
    ...orgBrainData.teams.map((value) => ["team", value.id, value] as const),
    ...orgBrainData.repositories.map(
      (value) => ["repository", value.id, value] as const,
    ),
    ...orgBrainData.services.map(
      (value) => ["service", value.id, value] as const,
    ),
    ...orgBrainData.serviceDependencies.map(
      (value, index) => ["service-dependency", `DEPEDGE-${index}`, value] as const,
    ),
    ...orgBrainData.workItems.map(
      (value) => ["work-item", value.id, value] as const,
    ),
    ...orgBrainData.commits.map((value) => ["commit", value.sha, value] as const),
    ...orgBrainData.sourceSnapshots.map(
      (value, index) => ["source-snapshot", `SOURCE-${index}`, value] as const,
    ),
    ...orgBrainData.deployments.map(
      (value) => ["deployment", value.id, value] as const,
    ),
    ...orgBrainData.incidents.map(
      (value) => ["incident", value.id, value] as const,
    ),
    ...orgBrainData.traces.map((value) => ["trace", value.id, value] as const),
    ...orgBrainData.logs.map((value) => ["log", value.id, value] as const),
    ...orgBrainData.metrics.map(
      (value, index) => ["metric", `METRIC-${index}`, value] as const,
    ),
    ...orgBrainData.architectureDecisions.map(
      (value) => ["architecture-decision", value.id, value] as const,
    ),
  ];
}

export async function ensureD1OrganizationData(env: Env): Promise<boolean> {
  if (!env.DB) return false;
  await ensureSchema(env);
  const count = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM ${ENTITY_TABLE}`,
  ).first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return true;

  const now = new Date().toISOString();
  const statements = seedEntities().map(([type, id, value]) =>
    env.DB!.prepare(
      `INSERT OR IGNORE INTO ${ENTITY_TABLE}
       (entity_type, entity_id, payload_json, updated_at)
       VALUES (?, ?, ?, ?)`,
    ).bind(type, id, JSON.stringify(value), now),
  );
  if (statements.length) await env.DB.batch(statements);
  return true;
}

async function listType<T>(env: Env, type: string): Promise<T[]> {
  if (!env.DB) return [];
  const result = await env.DB.prepare(
    `SELECT entity_id, payload_json FROM ${ENTITY_TABLE}
     WHERE entity_type = ? ORDER BY entity_id`,
  )
    .bind(type)
    .all<EntityRow>();
  return result.results
    .map((row) => parse<T>(row))
    .filter((value): value is T => value !== null);
}

async function getType<T>(
  env: Env,
  type: string,
  id: string,
): Promise<T | null> {
  if (!env.DB) return null;
  const row = await env.DB.prepare(
    `SELECT entity_id, payload_json FROM ${ENTITY_TABLE}
     WHERE entity_type = ? AND entity_id = ? LIMIT 1`,
  )
    .bind(type, id)
    .first<EntityRow>();
  return parse<T>(row);
}

const includes = (value: string | undefined, query: string) =>
  value?.toLowerCase().includes(query.toLowerCase()) ?? false;

export function createD1OrgProviders(env: Env): OrgBrainProviders {
  return {
    workItems: {
      list: () => listType<WorkItem>(env, "work-item"),
      getById: (id: WorkItemId) => getType<WorkItem>(env, "work-item", id),
      async search(query: string) {
        const items = await listType<WorkItem>(env, "work-item");
        return items.filter(
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
      async getRelated(id: WorkItemId) {
        const items = await listType<WorkItem>(env, "work-item");
        const item = items.find((candidate) => candidate.id === id);
        if (!item) return [];
        const relatedIds = new Set([
          ...(item.relatedWorkItemIds ?? []),
          ...(item.conflictsWith ?? []),
          ...(item.dependsOn ?? []),
          ...(item.blocks ?? []),
          ...(item.parentId ? [item.parentId] : []),
        ]);
        return items.filter(
          (candidate) =>
            relatedIds.has(candidate.id) || candidate.parentId === item.id,
        );
      },
      async createDraft(input: WorkItemDraft) {
        if (!env.DB) return input;
        const id = `HANDOFF-${crypto.randomUUID()}`;
        await env.DB.prepare(
          `INSERT INTO provider_handoffs
           (id, kind, payload_json, status, created_at)
           VALUES (?, 'work-item-draft', ?, 'prepared', ?)`,
        )
          .bind(id, JSON.stringify(input), new Date().toISOString())
          .run();
        return input;
      },
    },
    repositories: {
      list: () => listType<Repository>(env, "repository"),
      getById: (id: RepositoryId) =>
        getType<Repository>(env, "repository", id),
      async getCommit(repositoryId: RepositoryId, sha: CommitSha) {
        const commit = await getType<Commit>(env, "commit", sha);
        return commit?.repositoryId === repositoryId ? commit : null;
      },
      async getSourceSnapshot(
        repositoryId: RepositoryId,
        sha: CommitSha,
        path: string,
      ) {
        const snapshots = await listType<SourceSnapshot>(env, "source-snapshot");
        return (
          snapshots.find(
            (snapshot) =>
              snapshot.repositoryId === repositoryId &&
              snapshot.commitSha === sha &&
              snapshot.path === path,
          ) ?? null
        );
      },
    },
    services: {
      list: () => listType<Service>(env, "service"),
      getById: (id: ServiceId) => getType<Service>(env, "service", id),
      async getDependencies(id: ServiceId) {
        const dependencies = await listType<ServiceDependency>(
          env,
          "service-dependency",
        );
        return dependencies.filter(
          (dependency) => dependency.from === id || dependency.to === id,
        );
      },
    },
    deployments: {
      getById: (id: DeploymentId) =>
        getType<Deployment>(env, "deployment", id),
      async getForService(serviceId: ServiceId) {
        const deployments = await listType<Deployment>(env, "deployment");
        return deployments.filter(
          (deployment) => deployment.serviceId === serviceId,
        );
      },
      async getAroundTime(serviceId: ServiceId, timestamp: ISODateString) {
        const deployments = await listType<Deployment>(env, "deployment");
        const center = new Date(timestamp).getTime();
        const windowMs = 24 * 60 * 60 * 1000;
        return deployments.filter(
          (deployment) =>
            deployment.serviceId === serviceId &&
            Math.abs(new Date(deployment.deployedAt).getTime() - center) <=
              windowMs,
        );
      },
    },
    incidents: {
      list: () => listType<Incident>(env, "incident"),
      getById: (id: IncidentId) => getType<Incident>(env, "incident", id),
    },
    observability: {
      getTrace: (id: TraceId) => getType<Trace>(env, "trace", id),
      async getLogsByTrace(id: TraceId) {
        const logs = await listType<LogEntry>(env, "log");
        return logs.filter((log) => log.traceId === id);
      },
      async getLogsByService(
        serviceId: ServiceId,
        options?: { from?: ISODateString; to?: ISODateString },
      ) {
        const logs = await listType<LogEntry>(env, "log");
        return logs.filter((log) => {
          if (log.serviceId !== serviceId) return false;
          const timestamp = new Date(log.timestamp).getTime();
          if (options?.from && timestamp < new Date(options.from).getTime())
            return false;
          if (options?.to && timestamp > new Date(options.to).getTime())
            return false;
          return true;
        });
      },
      async getMetrics(serviceId: ServiceId) {
        const metrics = await listType<MetricComparison>(env, "metric");
        return metrics.filter((metric) => metric.serviceId === serviceId);
      },
    },
    architecture: {
      list: () =>
        listType<ArchitectureDecision>(env, "architecture-decision"),
      getById: (id: ArchitectureDecisionId) =>
        getType<ArchitectureDecision>(env, "architecture-decision", id),
      async getForService(serviceId: ServiceId) {
        const decisions = await listType<ArchitectureDecision>(
          env,
          "architecture-decision",
        );
        return decisions.filter((decision) =>
          decision.relatedServiceIds?.includes(serviceId),
        );
      },
    },
  };
}

export async function listProviderHandoffs(env: Env) {
  if (!env.DB) return [];
  await ensureSchema(env);
  const result = await env.DB.prepare(
    `SELECT id, kind, payload_json, status, created_at
     FROM provider_handoffs ORDER BY created_at DESC LIMIT 50`,
  ).all<{
    id: string;
    kind: string;
    payload_json: string;
    status: string;
    created_at: string;
  }>();
  return result.results.map((row) => ({
    id: row.id,
    kind: row.kind,
    payload: JSON.parse(row.payload_json) as unknown,
    status: row.status,
    createdAt: row.created_at,
  }));
}
