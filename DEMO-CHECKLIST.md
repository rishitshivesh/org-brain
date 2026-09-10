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

Open the Worker health endpoint and confirm it responds before the demo:

```text
GET http://localhost:8787/health
```

## 3. Demo path A — Incident RCA

### Inject

Open `/scenario-lab`.

Inject:

**Claims submission latency spike**

Confirm the injected incident is visible and the hidden evaluation/root-cause answer is not displayed.

### Ask

Open `/` and submit exactly:

> Why did claims submission latency increase after the latest deployment?

### What should visibly happen

The Ask surface should show bounded specialist/tool activity including:

- specialist selection
- trace inspection
- logs inspection
- metric comparison
- deployment inspection
- commit inspection
- source-change inspection
- change correlation
- RCA synthesis
- mitigation/remediation preparation

### Expected evidence

Verify the response connects these real seeded references:

- incident `INC-2409`
- trace `tr_8b92f17c`
- deployment `DEP-2198`
- `claims-worker` v3.19.2
- commit `8fc19b2`
- document validation source change
- consumer processing approximately `42 ms → 890 ms`
- consumer lag approximately `4,200 → 91,000`
- CPU/memory remaining comparatively stable

The conclusion should attribute the strongest cause to sequential document validation rather than merely saying “the service was slow.”

## 4. Demo path B — Human approval

After RCA synthesis, choose:

**Mitigation + remediation**

Verify:

- approval is recorded
- remote mode shows durable investigation state
- the Workflow resumes after approval
- remediation is prepared for provider handoff
- no external rollback is executed
- no external Azure DevOps work item is actually created

The safety story matters: Org Brain proposes, a human approves, execution remains a separate boundary.

## 5. Demo path C — Planning intelligence

Submit:

> What changes if we support partial settlement for OPD claims?

Expected context:

- `ADO-4231`
- conflict with `ADO-3988`
- affected services
- `ADR-018`
- recommendation consistent with settlement lifecycle ownership

This proves Org Brain is broader than incident RCA.

## 6. Optional 30-second graph tour

Open `/graph` and show:

```text
Incident → Deployment → Commit → Work Item
```

Then briefly show service dependency/blast-radius context.

Do not spend the demo reading every card. The graph exists to prove the relationships are explicit rather than invented by the LLM.

## 7. Submission explanation

Use this short description if the form asks what you built:

> Org Brain is an AI-powered engineering intelligence workspace that connects work items, services, deployments, source changes, observability, incidents and architecture decisions. It resolves explicit engineering relationships programmatically, runs bounded specialist agents for work, observability, change, dependency and knowledge analysis, then uses Workers AI to synthesize evidence. Cloudflare Workflows and Durable Objects keep investigations durable and pause RCA actions for explicit human approval before any provider handoff.

## 8. Cloudflare products to name

- Workers
- Workers AI
- Workflows
- Durable Objects
- AI Gateway

Do not claim D1 or Vectorize are implemented unless they are actually added before submission.

## 9. Files reviewers should see

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

## 10. Final ten-minute sanity pass

- refresh the page during/after an investigation
- test `Cmd/Ctrl + K`
- verify long chat and tables scroll correctly
- verify no console-breaking client error
- verify approval question is clickable
- verify Cloudflare/local badge is correct
- verify Worker CORS origin matches deployed frontend
- verify no secret is committed
- verify `.env.local` is ignored
- verify scenario answer key is not imported client-side
- open repository in an incognito/logged-out context if reviewers need public access

## Do not spend remaining time on

- more visual redesign
- more specialist agents
- full Azure DevOps integration
- real rollback execution
- migrating all seed data to a database
- adding eight more scenarios

A stable, explainable end-to-end path is worth far more than another half-finished subsystem.
