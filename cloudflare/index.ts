import type { ApprovalAction } from "../agents";
import type {
  CreateInvestigationInput,
  InvestigationApprovalInput,
  InvestigationResponse,
  InvestigationState,
} from "../types/investigation";
import type { Env } from "./env";
import { InvestigationStateObject } from "./investigation-state";
import { patchInvestigation, readInvestigation, writeInvestigation } from "./state-client";
import { InvestigationWorkflow } from "./workflow";

export { InvestigationStateObject, InvestigationWorkflow };

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

function corsHeaders(env: Env, request: Request): HeadersInit {
  const configured = env.ALLOWED_ORIGIN?.trim() || "*";
  const requestOrigin = request.headers.get("origin");
  const origin = configured === "*" || requestOrigin === configured ? configured : "null";

  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function json(env: Env, request: Request, value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...jsonHeaders, ...corsHeaders(env, request) },
  });
}

function isApprovalAction(value: unknown): value is ApprovalAction {
  return value === "mitigation" || value === "remediation";
}

function investigationIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/v1\/investigations\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function approvalIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/v1\/investigations\/([^/]+)\/approval$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function createInvestigation(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => null)) as CreateInvestigationInput | null;
  const query = body?.query?.trim();

  if (!query) return json(env, request, { error: "query is required" }, 400);
  if (query.length > 4000) return json(env, request, { error: "query is too long" }, 400);

  const id = `INV-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const state: InvestigationState = {
    id,
    query,
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };

  await writeInvestigation(env, state);

  try {
    const instance = await env.INVESTIGATION_WORKFLOW.create({
      id,
      params: { investigationId: id, query },
    });
    const investigation = await patchInvestigation(env, id, {
      workflowInstanceId: instance.id,
    });
    const response: InvestigationResponse = { runtime: "cloudflare", investigation };
    return json(env, request, response, 202);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start workflow";
    await patchInvestigation(env, id, { status: "failed", error: message });
    return json(env, request, { error: message, investigationId: id }, 500);
  }
}

async function getInvestigation(
  request: Request,
  env: Env,
  investigationId: string,
): Promise<Response> {
  const investigation = await readInvestigation(env, investigationId);
  if (!investigation) return json(env, request, { error: "Investigation not found" }, 404);
  const response: InvestigationResponse = { runtime: "cloudflare", investigation };
  return json(env, request, response);
}

async function approveInvestigation(
  request: Request,
  env: Env,
  investigationId: string,
): Promise<Response> {
  const investigation = await readInvestigation(env, investigationId);
  if (!investigation) return json(env, request, { error: "Investigation not found" }, 404);
  if (!investigation.result?.rca) {
    return json(env, request, { error: "This investigation has no RCA approval step" }, 409);
  }
  if (investigation.status !== "waiting-approval") {
    return json(env, request, { error: `Investigation is ${investigation.status}` }, 409);
  }

  const body = (await request.json().catch(() => null)) as InvestigationApprovalInput | null;
  const actions = body?.actions?.filter(isApprovalAction) ?? [];
  const uniqueActions = [...new Set(actions)];
  const workflowId = investigation.workflowInstanceId ?? investigation.id;
  const instance = await env.INVESTIGATION_WORKFLOW.get(workflowId);

  await instance.sendEvent({
    type: "rca-approval",
    payload: { actions: uniqueActions },
  });

  return json(
    env,
    request,
    {
      runtime: "cloudflare",
      investigationId,
      accepted: true,
      actions: uniqueActions,
      execution: "not-executed",
    },
    202,
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json(env, request, {
        status: "ok",
        runtime: "cloudflare-workers",
        ai: env.AI_MODEL ?? "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        gateway: env.AI_GATEWAY_ID ?? "default",
        workflow: "org-brain-investigation",
        durableState: "InvestigationStateObject",
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/investigations") {
      return createInvestigation(request, env);
    }

    const approvalId = approvalIdFromPath(url.pathname);
    if (request.method === "POST" && approvalId) {
      return approveInvestigation(request, env, approvalId);
    }

    const investigationId = investigationIdFromPath(url.pathname);
    if (request.method === "GET" && investigationId) {
      return getInvestigation(request, env, investigationId);
    }

    return json(env, request, { error: "Not found" }, 404);
  },
};
