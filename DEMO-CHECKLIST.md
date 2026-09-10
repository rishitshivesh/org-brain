# Org Brain — Final Demo Checklist

Use this immediately before submission. The goal is a clean, repeatable 3–5 minute demo, not an expedition through every screen.

## 1. Local quality gate

Run from the repository root:

```bash
yarn install
yarn format
yarn lint
yarn typecheck
yarn build
```

Fix any error before recording/submitting. Warnings that do not affect runtime can be documented, but do not ignore TypeScript or build failures.

## 2. Cloudflare runtime

Start the Worker:

```bash
yarn cf:dev
```

Set frontend environment:

```bash
NEXT_PUBLIC_ORG_BRAIN_API_URL=http://localhost:8787
```

Start Next.js:

```bash
yarn dev
```

Confirm `GET http://localhost:8787/health` responds before the demo.

## 3. Primary demo — Incident RCA

Open `/scenario-lab`, inject **Claims submission latency spike**, copy its guided Ask prompt, then open `/` and submit it.

Expected evidence:

- `INC-2409`
- `tr_8b92f17c`
- `DEP-2198`
- `claims-worker` v3.19.2
- commit `8fc19b2`
- sequential document validation
- consumer processing `42 ms → 890 ms`
- consumer lag `4,200 → 91,000`
- CPU/memory comparatively stable

The conclusion should attribute the strongest cause to sequential document validation rather than merely saying the service was slow.

## 4. Human approval

After RCA synthesis choose **Mitigation + remediation**.

Verify:

- approval is recorded
- remote mode shows durable investigation state
- the Workflow resumes after approval
- remediation is prepared for provider handoff
- no external rollback is executed
- no external Azure DevOps item is created

The safety story matters: Org Brain proposes, a human approves, execution remains a separate boundary.

## 5. Secondary scenario — Database pool exhaustion

Inject **Intermittent checkout timeouts** and use its guided prompt.

Expected investigation path:

- `INC-2417`
- `tr_4cc71d02`
- `DEP-2214`
- commit `c41db71`
- `db.acquireConnection` is the dominant leaf span
- pool max `24 → 6`
- pending acquisitions `1 → 31`
- checkout p95 `312 ms → 2260 ms`
- CPU stays close to baseline

Expected RCA: a capacity regression caused by an undersized connection pool, not generic CPU or database-server saturation.

## 6. Secondary scenario — Retry amplification

Inject **Cascading downstream failures** and use its guided prompt.

Expected investigation path:

- `INC-2424`
- `tr_92f4ad10`
- `DEP-2231`
- commit `a90ed31`
- five document validation attempts in one request path
- document requests per claim `1.1 → 4.7`
- document-service traffic `390 → 1840 rps`
- document-service error rate `0.8% → 18.6%`
- ADR-031 requires bounded exponential backoff

Expected RCA: near-immediate retries amplify an existing dependency failure into a broader traffic and latency cascade.

Only show one secondary scenario in the recorded demo unless there is time. Having all three available is useful for reviewer exploration.

## 7. Planning intelligence

Submit:

> What changes if we support partial settlement for OPD claims?

Expected context:

- `ADO-4231`
- conflict with `ADO-3988`
- affected services
- `ADR-018`
- recommendation consistent with settlement lifecycle ownership

This proves Org Brain is broader than incident RCA.

## 8. Optional 30-second graph tour

Open `/graph` and show:

```text
Incident → Deployment → Commit → Work Item
```

Then briefly show service dependency/blast-radius context. The graph proves the relationships are explicit rather than invented by the LLM.

## 9. Submission explanation

> Org Brain is an AI-powered engineering intelligence workspace that connects work items, services, deployments, source changes, observability, incidents and architecture decisions. It resolves explicit engineering relationships programmatically, runs bounded specialist agents for work, observability, change, dependency and knowledge analysis, then uses Workers AI to synthesize evidence. Cloudflare Workflows and Durable Objects keep investigations durable and pause RCA actions for explicit human approval before any provider handoff.

## 10. Cloudflare products to name

- Workers
- Workers AI
- Workflows
- Durable Objects
- AI Gateway

Do not claim D1 or Vectorize are implemented unless they are actually added before submission.

## 11. Files reviewers should see

- `SUBMISSION.md`
- `README.md`
- `PRD.md`
- `AI-COMMANDS.md`
- `cloudflare/index.ts`
- `cloudflare/workflow.ts`
- `cloudflare/investigation-state.ts`
- `cloudflare/ai.ts`
- `agents/`
- `providers/`
- `lib/context-builders.ts`
- `data/scenarios/`

## 12. Final ten-minute sanity pass

- refresh the page during/after an investigation
- test `Cmd/Ctrl + K`
- verify long chat and tables scroll correctly
- verify all three Scenario Lab fixtures show as seeded
- verify each scenario opens the correct incident
- verify guided prompt copy works
- verify no console-breaking client error
- verify approval question is clickable
- verify Cloudflare/local badge is correct
- verify Worker CORS origin matches deployed frontend
- verify no secret is committed
- verify `.env.local` is ignored
- verify scenario answer key is not imported client-side
- open repository in an incognito/logged-out context if reviewers need public access
