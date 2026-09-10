import type { InvestigationState } from "../types/investigation";
import type { Env } from "./env";

export interface MemoryMatch {
  id: string;
  score: number;
  incidentId?: string;
  rootCause?: string;
  mitigation?: string;
}

function embeddingFrom(response: unknown): number[] | null {
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: unknown }).data;
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
  return data[0].every((value) => typeof value === "number")
    ? (data[0] as number[])
    : null;
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
  const response = await env.AI.run(env.EMBEDDING_MODEL ?? "@cf/baai/bge-base-en-v1.5", {
    text: [text],
  });
  const values = embeddingFrom(response);
  if (!values) return false;

  await env.MEMORY.upsert([
    {
      id: investigation.id,
      values,
      metadata: {
        incidentId: rca.incidentId,
        rootCause: rca.rootCause,
        mitigation: rca.mitigation,
        type: "incident-rca",
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
  if (!env.MEMORY) return [];
  const response = await env.AI.run(env.EMBEDDING_MODEL ?? "@cf/baai/bge-base-en-v1.5", {
    text: [query],
  });
  const vector = embeddingFrom(response);
  if (!vector) return [];

  const result = await env.MEMORY.query(vector, {
    topK: Math.max(1, Math.min(10, Math.floor(topK))),
    returnMetadata: "all",
  });

  return result.matches.map((match) => {
    const metadata = match.metadata ?? {};
    return {
      id: match.id,
      score: match.score,
      incidentId:
        typeof metadata.incidentId === "string" ? metadata.incidentId : undefined,
      rootCause:
        typeof metadata.rootCause === "string" ? metadata.rootCause : undefined,
      mitigation:
        typeof metadata.mitigation === "string" ? metadata.mitigation : undefined,
    };
  });
}
