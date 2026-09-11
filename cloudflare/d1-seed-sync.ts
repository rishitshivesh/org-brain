import { orgBrainData } from "../lib/org-brain";
import type { Env } from "./env";

const ENTITY_TABLE = "org_entities";
const SEED_VERSION = "2026-09-11-edge-v2";

function entities() {
  return [
    ...orgBrainData.teams.map((value) => ["team", value.id, value] as const),
    ...orgBrainData.repositories.map(
      (value) => ["repository", value.id, value] as const,
    ),
    ...orgBrainData.services.map(
      (value) => ["service", value.id, value] as const,
    ),
    ...orgBrainData.serviceDependencies.map(
      (value, index) =>
        ["service-dependency", `DEPEDGE-${index}`, value] as const,
    ),
    ...orgBrainData.workItems.map(
      (value) => ["work-item", value.id, value] as const,
    ),
    ...orgBrainData.commits.map(
      (value) => ["commit", value.sha, value] as const,
    ),
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

export async function syncD1OrganizationSeed(env: Env): Promise<boolean> {
  if (!env.DB) return false;

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS ${ENTITY_TABLE} (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (entity_type, entity_id)
    )`,
  ).run();

  const current = await env.DB.prepare(
    `SELECT payload_json FROM ${ENTITY_TABLE}
     WHERE entity_type = 'seed-meta' AND entity_id = 'version' LIMIT 1`,
  ).first<{ payload_json: string }>();

  if (current?.payload_json === SEED_VERSION) return true;

  const now = new Date().toISOString();
  const statements = entities().map(([type, id, value]) =>
    env
      .DB!.prepare(
        `INSERT INTO ${ENTITY_TABLE}
          (entity_type, entity_id, payload_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(entity_type, entity_id) DO UPDATE SET
           payload_json = excluded.payload_json,
           updated_at = excluded.updated_at`,
      )
      .bind(type, id, JSON.stringify(value), now),
  );

  statements.push(
    env.DB.prepare(
      `INSERT INTO ${ENTITY_TABLE}
        (entity_type, entity_id, payload_json, updated_at)
       VALUES ('seed-meta', 'version', ?, ?)
       ON CONFLICT(entity_type, entity_id) DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`,
    ).bind(SEED_VERSION, now),
  );

  await env.DB.batch(statements);
  return true;
}

export function getOrganizationSeedVersion(): string {
  return SEED_VERSION;
}
