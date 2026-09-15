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

## 2. Local Cloudflare setup

Local development intentionally does **not** use Vectorize because Vectorize has no local emulator. Local history/memory falls back to D1 while Workers AI remains a remote binding.

```bash
yarn cf:d1:local
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
- D1 fallback memory in local mode

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

## 4. Edit remediation before approval

While the investigation is `waiting-approval`, copy its investigation ID from Ask or History and open:

```text
/remediation/<investigation-id>
```

Change one acceptance criterion and click **Save durable draft**.

## 5. Human approval + provider handoff

Return to Ask and approve **Mitigation + remediation**.

Verify:

- the same Cloudflare Workflow resumes
- approval becomes durable
- the Workflow reads the latest edited remediation draft
- `/handoffs` contains a D1-backed prepared work-item handoff
- external mutations remain `0`

## 6. Closed-loop memory

Open `/history` and confirm the completed RCA appears in D1 history.

Local search uses bounded D1 ranking. In production, after Vectorize is configured/bootstraped, organization memory can also return prior RCA, ADR and work-item vectors.

## 7. Strong edge/security demo — WAF

Inject **WAF blocks legitimate document uploads**.

> Investigate INC-2431. Determine whether the 403s originate at WAF, NGINX or claims-api, correlate the latest edge-policy change, preserve security controls, and propose the narrowest safe mitigation.

Expected shape:

- `INC-2431`
- trace `tr_waf_31fd2c`
- deployment `DEP-2244`
- commit `f3a21d9`
- WAF is the rejection layer
- legitimate multipart traffic is blocked before reaching the app
- mitigation narrows the rule rather than disabling WAF broadly

Then open `/flows` to show the explicit WAF → NGINX → application path.

## 8. Edge timeout demo — NGINX

Inject **NGINX returns 504 while claims-api succeeds**.

> Investigate INC-2438. Explain why users receive 504 while claims-api reports success, inspect the WAF-to-NGINX-to-API-to-document path, correlate recent NGINX configuration, and recommend a bounded timeout fix.

Expected shape:

- `INC-2438`
- trace `tr_nginx_81ce7a`
- deployment `DEP-2250`
- commit `b7d992a`
- NGINX proxy timeout is below the supported application latency budget
- downstream application work can complete after the edge has already returned 504

## 9. Other seeded scenarios

The reviewer can also explore:

- `INC-2417` — database connection-pool exhaustion
- `INC-2424` — retry amplification / cascading dependency failure

All five scenarios have hidden server-only evaluation contracts.

## 10. Planning intelligence + work package

Ask:

> Plan the implementation for partial settlement support for OPD claims and break it down into work items.

Expected context:

- `ADO-4231`
- explicit conflict with `ADO-3988`
- affected services
- `ADR-018`
- Work Agent activity
- generated feature + per-service Story package with acceptance criteria

## 11. Evaluation harness

Open `/evaluations`.

Explain that all five seeded incidents are run through the same orchestrator and scored against a **server-only** hidden evaluation contract on:

- evidence coverage
- service attribution
- deployment attribution
- commit/change attribution
- causal alignment

The browser receives scores, not the answer key.

## 12. Architecture + runtime close

Open `/architecture` and show:

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

## 13. Production deployment

```bash
yarn cf:memory:setup
yarn cf:d1:remote
yarn cf:deploy
```

Configure production:

```text
ALLOWED_ORIGIN=https://<frontend-origin>
NEXT_PUBLIC_ORG_BRAIN_API_URL=https://<worker-origin>
```

Open `/runtime` against the deployed Worker. Bootstrap organization memory once if the Vectorize index is empty.

## 14. Cloudflare products to name

- Workers
- Workers AI
- AI Gateway
- Workflows
- Durable Objects
- D1
- Vectorize

## 15. Final sanity pass

- `yarn format`
- `yarn lint`
- `yarn typecheck`
- `yarn build`
- `yarn cf:dev`
- `/runtime` reports Worker online
- all five Scenario Lab fixtures open the correct incident
- guided prompt copy works
- `/flows` renders edge/application paths
- long chat/tables scroll correctly
- remediation can be edited before approval and not after
- approval resumes the Workflow
- approved remediation appears under `/handoffs`
- history persists after refresh
- local memory search handles long natural-language prompts without SQLite LIKE/GLOB failures
- memory search does not expose hidden evaluation truth
- no console-breaking client error
- CORS origin matches deployed frontend
- no secret or `.env.local` is committed
- `data/scenarios/evaluation.ts` is not imported by client/runtime agent code
- repository visibility/access matches submission requirements

## 16. Files reviewers should see

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
- `wrangler.jsonc`
- `wrangler.local.jsonc`
- `agents/`
- `lib/context-builders.ts`
- `data/scenarios/`
- `app/flows/`
- `app/evaluations/`
