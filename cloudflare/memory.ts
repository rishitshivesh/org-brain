import { orgBrainData } from "../lib/org-brain";
import type { InvestigationState } from "../types/investigation";
import type { Env } from "./env";
import { searchPersistedHistory } from "./persistence";

export type MemoryKind = "incident-rca" | "architecture-decision" | "work-item";

export interface MemoryMatch {
  id: string;
  score: number;
  kind?: MemoryKind;
  title?: string;
  summary?: string;
  incidentId?: string;
  rootCause?: string;
  mitigation?: string;
  source: "vectorize" | "d1";
}

let organizationMemoryIndexed = false;

function embeddingsFrom(response: unknown): number[][] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is number[] =>
      Array.isArray(row) && row.every((value) => typeof value === "number"),
  );
}

function embeddingFrom(response: unknown): number[] | null {
  return embeddingsFrom(response)[0] ?? null;
}

export async function indexOrganizationMemory(env: Env): Promise<boolean> {
  if (!env.MEMORY) return false;
  if (organizationMemoryIndexed) return true;

  const records = [
    ...orgBrainData.architectureDecisions.map((decision) => ({
      id: `adr:${decision.id}`,
      kind: "architecture-decision" as const,
      title: `${decision.id} · ${decision.title}`,
      summary: decision.summary,
      text: [
        `Architecture decision ${decision.id}: ${decision.title}`,
        decision.summary,
        `Status: ${decision.status}`,
        `Services: ${(decision.relatedServiceIds ?? []).join(", ")}`,
      ].join("\n"),
    })),
    ...orgBrainData.workItems.map((item) => ({
      id: `work:${item.id}`,
      kind: "work-item" as const,
      title: `${item.id} · ${item.title}`,
      summary: item.description ?? item.title,
      text: [
        `Work item ${item.id}: ${item.title}`,
        item.description ?? "",
        `State: ${item.state}`,
        `Tags: ${(item.tags ?? []).join(", ")}`,
        `Services: ${(item.relatedServiceIds ?? []).join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    })),
  ];

  const response = await env.AI.run(
    env.EMBEDDING_MODEL ?? "@cf/baai/bge-base-en-v1.5",
    { text: records.map((record) => record.text) },
  );
  const vectors = embeddingsFrom(response);
  if (vectors.length !== records.length) return false;

  await env.MEMORY.upsert(
    records.map((record, index) => ({
      id: record.id,
      values: vectors[index]!,
      metadata: {
        kind: record.kind,
        title: record.title,
        summary: record.summary,
      },
    })),
  );
  organizationMemoryIndexed = true;
  return true;
}

export async function indexInvestigationMemory(
  env: Env,
  investigation: InvestigationState,
): Promise<boolean> {
  if (!env.MEMORY || !investigation.result?.rca) return false;

  const { rca } = investigation.result;
  const text = [
    `Incident: ${rca.incidentId}`,
    `Query: ${investigation.query}`,
    `Root cause: ${rca.rootCause}`,
    `Mitigation: ${rca.mitigation}`,
    `Remediation: ${rca.remediationDraft.title}`,
  ].join("\n");
  const response = await env.AI.run(
    env.EMBEDDING_MODEL ?? "@cf/baai/bge-base-en-v1.5",
    { text: [text] },
  );
  const values = embeddingFrom(response);
  if (!values) return false;

  await env.MEMORY.upsert([
    {
      id: investigation.id,
      values,
      metadata: {
        kind: "incident-rca",
        title: `${rca.incidentId} · historical RCA`,
        summary: rca.rootCause,
        incidentId: rca.incidentId,
        rootCause: rca.rootCause,
        mitigation: rca.mitigation,
      },
    },
  ]);
  return true;
}

export async function searchInvestigationMemory(
  env: Env,
  query: string,
  topK = 5,
): Promise<MemoryMatch[]> {
  if (env.MEMORY) {
    await indexOrganizationMemory(env);
    const response = await env.AI.run(
      env.EMBEDDING_MODEL ?? "@cf/baai/bge-base-en-v1.5",
      { text: [query] },
    );
    const vector = embeddingFrom(response);
    if (vector) {
      const result = await env.MEMORY.query(vector, {
        topK: Math.max(1, Math.min(10, Math.floor(topK))),
        returnMetadata: "all",
      });

      return result.matches.map((match) => {
        const metadata = match.metadata ?? {};
        return {
          id: match.id,
          score: match.score,
          kind:
            metadata.kind === "incident-rca" ||
            metadata.kind === "architecture-decision" ||
            metadata.kind === "work-item"
              ? metadata.kind
              : undefined,
          title:
            typeof metadata.title === "string" ? metadata.title : undefined,
          summary:
            typeof metadata.summary === "string" ? metadata.summary : undefined,
          incidentId:
            typeof metadata.incidentId === "string"
              ? metadata.incidentId
              : undefined,
          rootCause:
            typeof metadata.rootCause === "string"
              ? metadata.rootCause
              : undefined,
          mitigation:
            typeof metadata.mitigation === "string"
              ? metadata.mitigation
              : undefined,
          source: "vectorize" as const,
        };
      });
    }
  }

  const rows = await searchPersistedHistory(env, query, topK);
  return rows.map((row, index) => ({
    id: row.id,
    score: Math.max(0.35, 0.65 - index * 0.06),
    kind: "incident-rca" as const,
    title: row.incidentId ? `${row.incidentId} · historical RCA` : row.query,
    summary: row.rootCause ?? undefined,
    incidentId: row.incidentId ?? undefined,
    rootCause: row.rootCause ?? undefined,
    mitigation: row.mitigation ?? undefined,
    source: "d1" as const,
  }));
}
