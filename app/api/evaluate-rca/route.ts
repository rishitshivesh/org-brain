import type { OrchestrationResult } from "@/agents";
import { evaluateSeededRca } from "@/lib/scenario-evaluator";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { result?: OrchestrationResult }
    | null;

  if (!body?.result?.rca) {
    return Response.json({ error: "RCA result is required" }, { status: 400 });
  }

  const evaluation = evaluateSeededRca(body.result);
  if (!evaluation) {
    return Response.json(
      { error: "No seeded evaluation contract exists for this RCA" },
      { status: 404 },
    );
  }

  return Response.json(evaluation, {
    headers: { "cache-control": "no-store" },
  });
}
