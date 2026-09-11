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

export async function indexOrganizationMemory(env: Env): Promise<{
  indexed: number;
  ok: boolean;
  error?: string;
}> {
  if (!env.MEMORY)
    return { indexed: 0, ok: false, error: "MEMORY is not bound" };

  try {
    const records = [
      ...orgBrainData.architectureDecisions.map((decision) => ({
        id: `adr:${decision.id}`,
        kind: "architecture-decision" as const,
        title: `${decision.id} · ${decision.title}`,
        summary: decision.summary,
        text: [
          `Architecture decision ${decision.id}: ${decision.title}`,
          decision.summary,
          decision.context ?? "",
          decision.decision ?? "",
          `Status: ${decision.status}`,
          `Services: ${(decision.relatedServiceIds ?? []).join(", ")}`,
        ]
          .filter(Boolean)
          .join("\n"),
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
          `Acceptance criteria: ${(item.acceptanceCriteria ?? []).join(" | ")}`,
        ]
          .filter(Boolean)
          .join("\n"),
      })),
    ];

    const batchSize = 20;
    let indexed = 0;
    for (let start = 0; start < records.length; start += batchSize) {
      const batch = records.slice(start, start + batchSize);
      const response = await env.AI.run(
        env.EMBEDDING_MODEL ?? "@cf/baai/bge-base-en-v1.5",
        { text: batch.map((record) => record.text) },
      );
      const vectors = embeddingsFrom(response);
      if (vectors.length !== batch.length) {
        return {
          indexed,
          ok: false,
          error: `Embedding response contained ${vectors.length} vectors for ${batch.length} records`,
        };
      }

      await env.MEMORY.upsert(
        batch.map((record, index) => ({
          id: record.id,
          values: vectors[index]!,
          metadata: {
            kind: record.kind,
            title: record.title,
            summary: record.summary,
          },
        })),
      );
      indexed += batch.length;
    }

    return { indexed, ok: true };
  } catch (error) {
    return {
      indexed: 0,
      ok: false,
      error: error instanceof Error ? error.message : "Memory bootstrap failed",
    };
  }
}

export async function indexInvestigationMemory(
  env: Env,
  investigation: InvestigationState,
): Promise<boolean> {
  if (!env.MEMORY || !investigation.result?.rca) return false;

  try {
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
  } catch (error) {
    console.warn(
      "Vectorize incident indexing failed; investigation will continue without semantic memory",
      error,
    );
    return false;
  }
}

export async function searchInvestigationMemory(
  env: Env,
  query: string,
  topK = 5,
): Promise<MemoryMatch[]> {
  if (env.MEMORY) {
    try {
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

        if (result.matches.length) {
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
                typeof metadata.summary === "string"
                  ? metadata.summary
                  : undefined,
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
    } catch (error) {
      console.warn(
        "Vectorize search unavailable; falling back to persisted D1 history",
        error,
      );
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
