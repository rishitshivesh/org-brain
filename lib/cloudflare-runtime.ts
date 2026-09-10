import type { ApprovalAction, OrchestrationResult } from "@/agents";
import type {
  InvestigationResponse,
  InvestigationState,
} from "@/types/investigation";

const configuredBaseUrl = process.env.NEXT_PUBLIC_ORG_BRAIN_API_URL?.trim();
const apiBaseUrl = configuredBaseUrl?.replace(/\/$/, "");

const pollIntervalMs = 650;
const resultTimeoutMs = 60_000;
const approvalTimeoutMs = 20_000;

function endpoint(path: string): string {
  if (!apiBaseUrl) throw new Error("Cloudflare runtime is not configured");
  return `${apiBaseUrl}${path}`;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    T | { error?: string } | null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error
        ? payload.error
        : `Org Brain runtime request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isCloudflareRuntimeConfigured(): boolean {
  return Boolean(apiBaseUrl);
}

export async function createRemoteInvestigation(
  query: string,
): Promise<InvestigationState> {
  const response = await requestJson<InvestigationResponse>(
    endpoint("/v1/investigations"),
    {
      method: "POST",
      body: JSON.stringify({ query }),
    },
  );
  return response.investigation;
}

export async function getRemoteInvestigation(
  investigationId: string,
): Promise<InvestigationState> {
  const response = await requestJson<InvestigationResponse>(
    endpoint(`/v1/investigations/${encodeURIComponent(investigationId)}`),
  );
  return response.investigation;
}

export async function waitForRemoteResult(
  investigationId: string,
): Promise<InvestigationState> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < resultTimeoutMs) {
    const investigation = await getRemoteInvestigation(investigationId);

    if (investigation.status === "failed") {
      throw new Error(investigation.error ?? "Cloudflare investigation failed");
    }

    if (investigation.result) return investigation;
    await sleep(pollIntervalMs);
  }

  throw new Error(
    "Cloudflare investigation did not return a result within 60 seconds",
  );
}

export async function runRemoteInvestigation(query: string): Promise<{
  investigationId: string;
  investigation: InvestigationState;
  result: OrchestrationResult;
}> {
  const created = await createRemoteInvestigation(query);
  const investigation = await waitForRemoteResult(created.id);

  if (!investigation.result) {
    throw new Error(
      "Cloudflare investigation completed without an orchestration result",
    );
  }

  return {
    investigationId: investigation.id,
    investigation,
    result: investigation.result,
  };
}

export async function approveRemoteInvestigation(
  investigationId: string,
  actions: ApprovalAction[],
): Promise<InvestigationState> {
  await requestJson(
    endpoint(
      `/v1/investigations/${encodeURIComponent(investigationId)}/approval`,
    ),
    {
      method: "POST",
      body: JSON.stringify({ actions }),
    },
  );

  const startedAt = Date.now();
  while (Date.now() - startedAt < approvalTimeoutMs) {
    const investigation = await getRemoteInvestigation(investigationId);
    if (investigation.status === "failed") {
      throw new Error(
        investigation.error ?? "Cloudflare approval workflow failed",
      );
    }
    if (investigation.approval && investigation.status === "completed") {
      return investigation;
    }
    await sleep(pollIntervalMs);
  }

  throw new Error(
    "Approval was accepted but durable completion was not observed within 20 seconds",
  );
}
