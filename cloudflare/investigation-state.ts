import { DurableObject } from "cloudflare:workers";

import type { InvestigationState } from "../types/investigation";
import type { Env } from "./env";

const STATE_KEY = "investigation";

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status });
}

export class InvestigationStateObject extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "GET") {
      const state = await this.ctx.storage.get<InvestigationState>(STATE_KEY);
      return state ? json(state) : json({ error: "Investigation not found" }, 404);
    }

    if (request.method === "PUT") {
      const state = (await request.json()) as InvestigationState;
      await this.ctx.storage.put(STATE_KEY, state);
      return json(state);
    }

    if (request.method === "PATCH") {
      const current = await this.ctx.storage.get<InvestigationState>(STATE_KEY);
      if (!current) return json({ error: "Investigation not found" }, 404);

      const patch = (await request.json()) as Partial<InvestigationState>;
      const next: InvestigationState = {
        ...current,
        ...patch,
        id: current.id,
        query: current.query,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      await this.ctx.storage.put(STATE_KEY, next);
      return json(next);
    }

    if (request.method === "DELETE") {
      await this.ctx.storage.deleteAll();
      return new Response(null, { status: 204 });
    }

    return json({ error: "Method not allowed" }, 405);
  }
}
