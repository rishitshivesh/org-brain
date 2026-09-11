import type { InvestigationState } from "../types/investigation";
import type { Env } from "./env";

export interface InvestigationHistoryRecord {
  id: string;
  query: string;
  incidentId: string | null;
  status: InvestigationState["status"];
  rootCause: string | null;
  confidence: number | null;
  mitigation: string | null;
  remediationTitle: string | null;
  approvalStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

let schemaReady = false;

const SEARCH_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "also",
  "and",
  "are",
  "been",
  "before",
  "being",
  "but",
  "can",
  "could",
  "for",
  "from",
  "have",
  "into",
  "investigate",
  "more",
  "recent",
  "show",
  "that",
  "the",
  "their",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
]);

async function ensureSchema(env: Env): Promise<void> {
  if (!env.DB || schemaReady) return;
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS investigations (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      incident_id TEXT,
      status TEXT NOT NULL,
      root_cause TEXT,
      confidence INTEGER,
      mitigation TEXT,
      remediation_title TEXT,
      remediation_json TEXT,
      approval_status TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_investigations_updated_at ON investigations(updated_at DESC)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_investigations_incident_id ON investigations(incident_id)",
  ).run();
  schemaReady = true;
}

function rowToHistory(
  row: Record<string, unknown>,
): InvestigationHistoryRecord {
  return {
    id: String(row.id),
    query: String(row.query),
    incidentId: row.incident_id ? String(row.incident_id) : null,
    status: String(row.status) as InvestigationState["status"],
    rootCause: row.root_cause ? String(row.root_cause) : null,
    confidence: row.confidence == null ? null : Number(row.confidence),
    mitigation: row.mitigation ? String(row.mitigation) : null,
    remediationTitle: row.remediation_title
      ? String(row.remediation_title)
      : null,
    approvalStatus: row.approval_status ? String(row.approval_status) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function tokenizeSearch(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(
          (token) =>
            token.length >= 3 &&
            token.length <= 48 &&
            !SEARCH_STOP_WORDS.has(token),
        )
        .slice(0, 12),
    ),
  ];
}

function historySearchScore(
  record: InvestigationHistoryRecord,
  tokens: string[],
): number {
  if (!tokens.length) return 0;

  const query = record.query.toLowerCase();
  const rootCause = record.rootCause?.toLowerCase() ?? "";
  const remediation = record.remediationTitle?.toLowerCase() ?? "";
  const incident = record.incidentId?.toLowerCase() ?? "";

  let score = 0;
  for (const token of tokens) {
    if (incident === token) score += 8;
    if (incident.includes(token)) score += 4;
    if (rootCause.includes(token)) score += 4;
    if (query.includes(token)) score += 3;
    if (remediation.includes(token)) score += 2;
  }

  return score;
}

export async function persistInvestigation(
  env: Env,
  investigation: InvestigationState,
): Promise<boolean> {
  if (!env.DB) return false;
  await ensureSchema(env);

  const rca = investigation.result?.rca;
  await env.DB.prepare(
    `INSERT INTO investigations (
      id, query, incident_id, status, root_cause, confidence, mitigation,
      remediation_title, remediation_json, approval_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      root_cause = excluded.root_cause,
      confidence = excluded.confidence,
      mitigation = excluded.mitigation,
      remediation_title = excluded.remediation_title,
      remediation_json = excluded.remediation_json,
      approval_status = excluded.approval_status,
      updated_at = excluded.updated_at`,
  )
    .bind(
      investigation.id,
      investigation.query,
      rca?.incidentId ?? null,
      investigation.status,
      rca?.rootCause ?? null,
      rca?.confidence ?? null,
      rca?.mitigation ?? null,
      rca?.remediationDraft.title ?? null,
      rca ? JSON.stringify(rca.remediationDraft) : null,
      investigation.approval?.status ?? null,
      investigation.createdAt,
      investigation.updatedAt,
    )
    .run();

  return true;
}

export async function listInvestigationHistory(
  env: Env,
  limit = 30,
): Promise<InvestigationHistoryRecord[]> {
  if (!env.DB) return [];
  await ensureSchema(env);
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const result = await env.DB.prepare(
    `SELECT id, query, incident_id, status, root_cause, confidence, mitigation,
      remediation_title, approval_status, created_at, updated_at
     FROM investigations
     ORDER BY updated_at DESC
     LIMIT ?`,
  )
    .bind(safeLimit)
    .all<Record<string, unknown>>();
  return result.results.map(rowToHistory);
}

export async function searchPersistedHistory(
  env: Env,
  query: string,
  limit = 5,
): Promise<InvestigationHistoryRecord[]> {
  if (!env.DB) return [];
  await ensureSchema(env);

  const safeLimit = Math.max(1, Math.min(10, Math.floor(limit)));
  const tokens = tokenizeSearch(query);
  if (!tokens.length) return [];

  // D1 is intentionally used as a lightweight local/fallback memory store.
  // Pull a bounded recent window and rank in Worker code instead of constructing
  // arbitrarily complex LIKE patterns from natural-language investigation prompts.
  const result = await env.DB.prepare(
    `SELECT id, query, incident_id, status, root_cause, confidence, mitigation,
      remediation_title, approval_status, created_at, updated_at
     FROM investigations
     ORDER BY updated_at DESC
     LIMIT 100`,
  ).all<Record<string, unknown>>();

  return result.results
    .map(rowToHistory)
    .map((record) => ({ record, score: historySearchScore(record, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map(({ record }) => record);
}

export async function updatePersistedRemediation(
  env: Env,
  investigationId: string,
  draft: unknown,
): Promise<void> {
  if (!env.DB) return;
  await ensureSchema(env);
  const title =
    typeof draft === "object" && draft && "title" in draft
      ? String((draft as { title?: unknown }).title ?? "")
      : "";
  await env.DB.prepare(
    `UPDATE investigations
     SET remediation_title = ?, remediation_json = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      title,
      JSON.stringify(draft),
      new Date().toISOString(),
      investigationId,
    )
    .run();
}
