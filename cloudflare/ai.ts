import type { OrchestrationResult } from "../agents";
import type { InvestigationAiMetadata } from "../types/investigation";
import type { Env } from "./env";
import type { MemoryMatch } from "./memory";

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DEFAULT_GATEWAY = "default";

interface WorkersAiTextResponse {
  response?: string;
}

export interface AiGroundingResult {
  answer: string;
  metadata: InvestigationAiMetadata;
}

function compactEvidence(
  result: OrchestrationResult,
  historicalMemory: MemoryMatch[],
) {
  return {
    plan: result.plan,
    specialists: result.runs.map((run) => ({
      agent: run.agent,
      summary: run.summary,
      references: run.references,
      findings: run.findings,
    })),
    rca: result.rca,
    references: result.references,
    deterministicAnswer: result.answer,
    historicalMemory: historicalMemory.map((match) => ({
      kind: match.kind,
      title: match.title,
      summary: match.summary,
      incidentId: match.incidentId,
      score: match.score,
      rootCause: match.rootCause,
      mitigation: match.mitigation,
      source: match.source,
    })),
  };
}

export async function groundAnswerWithWorkersAi(
  env: Env,
  query: string,
  result: OrchestrationResult,
  historicalMemory: MemoryMatch[] = [],
): Promise<AiGroundingResult> {
  const model = env.AI_MODEL ?? DEFAULT_MODEL;
  const gatewayId = env.AI_GATEWAY_ID ?? DEFAULT_GATEWAY;

  try {
    const response = (await env.AI.run(
      model,
      {
        messages: [
          {
            role: "system",
            content:
              "You are the synthesis layer for Org Brain, an engineering intelligence system. Use only the supplied deterministic evidence. Never invent service names, IDs, metrics, commits, deployments, work items, architecture decisions, or causal claims. Distinguish observation from inference. Preserve the existing RCA confidence instead of manufacturing a new score. Historical memory may include prior incident RCAs, work items, and accepted architecture decisions. Treat it as precedent/context only: it can support comparison and pattern recognition, but must never be presented as proof that the current incident has the same root cause. If the evidence is insufficient, say so. Be concise but technically useful.",
          },
          {
            role: "user",
            content: JSON.stringify({
              query,
              evidence: compactEvidence(result, historicalMemory),
            }),
          },
        ],
        max_tokens: 1000,
        temperature: 0.15,
      },
      {
        gateway: {
          id: gatewayId,
          skipCache: true,
        },
      },
    )) as WorkersAiTextResponse;

    if (!response.response?.trim()) {
      return {
        answer: result.answer,
        metadata: {
          model,
          gatewayId,
          used: false,
          fallbackReason: "Workers AI returned no text response",
        },
      };
    }

    return {
      answer: response.response.trim(),
      metadata: { model, gatewayId, used: true },
    };
  } catch (error) {
    return {
      answer: result.answer,
      metadata: {
        model,
        gatewayId,
        used: false,
        fallbackReason:
          error instanceof Error ? error.message : "Workers AI request failed",
      },
    };
  }
}
