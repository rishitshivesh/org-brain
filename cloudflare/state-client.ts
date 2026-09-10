import type { InvestigationState } from "../types/investigation";
import type { Env } from "./env";

const internalUrl = "https://investigation.internal/state";

function stubFor(env: Env, investigationId: string) {
  const id = env.INVESTIGATIONS.idFromName(investigationId);
  return env.INVESTIGATIONS.get(id);
}

export async function readInvestigation(
  env: Env,
  investigationId: string,
): Promise<InvestigationState | null> {
  const response = await stubFor(env, investigationId).fetch(internalUrl);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to read investigation (${response.status})`);
  return (await response.json()) as InvestigationState;
}

export async function writeInvestigation(
  env: Env,
  state: InvestigationState,
): Promise<InvestigationState> {
  const response = await stubFor(env, state.id).fetch(internalUrl, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!response.ok) throw new Error(`Failed to write investigation (${response.status})`);
  return (await response.json()) as InvestigationState;
}

export async function patchInvestigation(
  env: Env,
  investigationId: string,
  patch: Partial<InvestigationState>,
): Promise<InvestigationState> {
  const response = await stubFor(env, investigationId).fetch(internalUrl, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`Failed to patch investigation (${response.status})`);
  return (await response.json()) as InvestigationState;
}
