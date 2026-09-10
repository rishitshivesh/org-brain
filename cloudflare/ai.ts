import type { OrchestrationResult } from "../agents";
import type { InvestigationAiMetadata } from "../types/investigation";
import type { Env } from "./env";

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DEFAULT_GATEWAY = "default";

interface WorkersAiTextResponse {
  response?: string;
}

export interface AiGroundingResult {
  answer: string;
  metadata: InvestigationAiMetadata;
}

function compactEvidence(result: OrchestrationResult) {
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
  };
}

export async function groundAnswerWithWorkersAi(
  env: Env,
  query: string,
  result: OrchestrationResult,
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
              "You are the synthesis layer for Org Brain, an engineering intelligence system. Use only the supplied deterministic evidence. Never invent service names, IDs, metrics, commits, deployments, work items, architecture decisions, or causal claims. Distinguish observation from inference. Preserve the existing RCA confidence instead of manufacturing a new score. Be concise but technically useful. If the evidence is insufficient, say so.",
          },
          {
            role: "user",
            content: JSON.stringify({ query, evidence: compactEvidence(result) }),
          },
        ],
        max_tokens: 900,
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
        fallbackReason: error instanceof Error ? error.message : "Workers AI request failed",
      },
    };
  }
}
