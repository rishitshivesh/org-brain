# Org Brain — Final Demo Checklist

Use this immediately before submission. The strongest demo is a coherent closed loop, not a tour of every button humanity has managed to invent.

## 1. Quality gate

```bash
yarn install
yarn format
yarn lint
yarn typecheck
yarn build
```

Do not record around a TypeScript/build failure.

## 2. Cloudflare setup

Authenticate Wrangler, then ensure the memory resource exists:

```bash
yarn cf:memory:setup
```

Start the Worker:

```bash
yarn cf:dev
```

Set frontend `.env.local`:

```bash
NEXT_PUBLIC_ORG_BRAIN_API_URL=http://localhost:8787
```

Start Next.js:

```bash
yarn dev
```

Open `/runtime`. Confirm the Worker is online and inspect:

- Workers AI model
- AI Gateway
- Workflow
- Durable Object state
- D1 organization provider/history
- Vectorize memory, or D1 fallback if the local Vectorize binding is unavailable

## 3. Primary demo — incident RCA

Open `/scenario-lab` and inject **Claims submission latency spike**.

Use the guided prompt:

> Investigate INC-2409. Explain why claims submission latency increased, show the strongest runtime evidence, correlate any recent code or deployment change, and propose a mitigation plus remediation work item.

Expected evidence:

- `INC-2409`
- trace `tr_8b92f17c`
- deployment `DEP-2198`
- `claims-worker` v3.19.2
- commit `8fc19b2`
- sequential document validation source
- consumer processing `42 ms → 890 ms`
- consumer lag `4,200 → 91,000`
- CPU/memory comparatively stable

The Agent Elements activity should visibly separate trace/log/metric inspection, deployment/commit/source inspection, historical-memory search and RCA synthesis.

## 4. Edit the remediation before approval

While the investigation is `waiting-approval`, copy its investigation ID from Ask or History and open:

```text
/remediation/<investigation-id>
```

Change one acceptance criterion and click **Save durable draft**.

This demonstrates that generated actions are reviewable artifacts, not immutable LLM output.

## 5. Human approval + provider handoff

Return to Ask and approve **Mitigation + remediation**.

Verify:

- the same Cloudflare Workflow resumes
- approval becomes durable
- the Workflow reads the latest edited remediation draft
- `/handoffs` contains a D1-backed prepared work-item handoff
- external mutations remain `0`

The safety story is deliberate: proposal → human review → approval → provider boundary. No silent production rollback occurs.

## 6. Demonstrate closed-loop memory

Open `/history`.

Confirm the completed RCA appears in D1 history, then search:

> claims latency document validation

With Vectorize bound, results can include prior RCA, ADR and work-item memory. Without it, incident history falls back to D1 text retrieval.

Then run another incident and observe **Searched investigation memory** inside Ask before Workers AI synthesis.

## 7. Secondary scenario — database pool exhaustion

Inject **Intermittent checkout timeouts** and use its guided prompt.

Expected investigation shape:

- `INC-2417`
- `tr_4cc71d02`
- `DEP-2214`
- commit `c41db71`
- `db.acquireConnection` dominates
- pool max `24 → 6`
- pending acquisitions `1 → 31`
- checkout p95 `312 ms → 2260 ms`
- CPU remains close to baseline

Expected conclusion: connection-pool capacity/configuration regression, not generic CPU saturation.

## 8. Secondary scenario — retry amplification

Inject **Cascading downstream failures** and use its guided prompt.

Expected investigation shape:

- `INC-2424`
- `tr_92f4ad10`
- `DEP-2231`
- commit `a90ed31`
- repeated document validation attempts
- requests per claim `1.1 → 4.7`
- document-service traffic `390 → 1840 rps`
- document-service error rate `0.8% → 18.6%`

Expected conclusion: aggressive retry behavior amplifies a downstream slowdown into a wider failure cascade.

Only show one secondary scenario in the recorded demo unless time permits.

## 9. Planning intelligence + work package

Ask:

> Plan the implementation for partial settlement support for OPD claims and break it down into work items.

Expected context:

- `ADO-4231`
- explicit conflict with `ADO-3988`
- affected services
- `ADR-018`
- Work Agent activity
- a generated feature + per-service Story package with acceptance criteria

This proves Org Brain handles forward planning as well as incidents.

## 10. Evaluation harness

Open `/evaluations`.

Explain that each seeded incident is run through the same orchestrator and scored against a **server-only** hidden evaluation contract on:

- evidence coverage
- service attribution
- deployment attribution
- commit/change attribution
- causal alignment

The browser receives scores, not the answer key.

## 11. Architecture + runtime close

Open `/architecture` and show the closed loop:

```text
D1 providers
→ specialists
→ historical memory
→ Workers AI
→ Durable Object
→ Workflow approval
→ provider handoff
→ D1 / Vectorize memory
```

Then `/runtime` proves the configured Cloudflare components are reachable.

## 12. Cloudflare products to name

- Workers
- Workers AI
- AI Gateway
- Workflows
- Durable Objects
- D1
- Vectorize

## 13. Files reviewers should see

- `SUBMISSION.md`
- `README.md`
- `PRD.md`
- `AI-COMMANDS.md`
- `cloudflare/index.ts`
- `cloudflare/workflow.ts`
- `cloudflare/d1-providers.ts`
- `cloudflare/persistence.ts`
- `cloudflare/memory.ts`
- `cloudflare/investigation-state.ts`
- `agents/`
- `lib/context-builders.ts`
- `data/scenarios/`
- `app/evaluations/`

## 14. Final sanity pass

- `yarn format`
- `yarn lint`
- `yarn typecheck`
- `yarn build`
- `yarn cf:dev`
- `/runtime` reports Worker online
- all three scenarios open the correct incident
- guided prompt copy works
- long chat/tables scroll correctly
- remediation can be edited before approval and not after
- approval resumes the Workflow
- approved remediation appears under `/handoffs`
- history persists after refresh
- memory search does not expose hidden evaluation truth
- no console-breaking client error
- CORS origin matches deployed frontend
- no secret or `.env.local` is committed
- `data/scenarios/evaluation.ts` is not imported by client/runtime agent code
- repository visibility/access matches submission requirements
