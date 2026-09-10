# Org Brain

Org Brain is an AI-powered engineering intelligence workspace that connects work items, services, repositories, deployments, traces, logs, metrics, incidents and architecture decisions into one coordinated context model.

The design rule is simple: **programmatic first, AI second**. Explicit relationships are resolved through provider contracts and graph edges before Workers AI is allowed to reason over the resulting evidence.

> **Reviewer shortcuts:** start with [`SUBMISSION.md`](./SUBMISSION.md), use [`DEMO-CHECKLIST.md`](./DEMO-CHECKLIST.md) for the demo path, and see [`AI-COMMANDS.md`](./AI-COMMANDS.md) for representative AI-assisted development prompts.

## What is implemented

- Next.js portal using Agent Elements
- Work, incidents, services, graph, knowledge and Scenario Lab surfaces
- three deterministic incident evidence packs
- five bounded specialists: Work, Observability, Change, Dependency and Knowledge
- evidence-backed RCA synthesis with hidden-truth evaluation
- Cloudflare Worker API
- Cloudflare Workflows orchestration and `waitForEvent` approval pause/resume
- Durable Object per-investigation state
- D1-backed organization provider adapter, investigation history and provider-handoff ledger
- Vectorize organizational memory for prior RCAs, ADRs and work items, with D1 history fallback
- Workers AI Llama 3.3 synthesis through AI Gateway
- editable remediation drafts before approval
- generated feature/story work packages for planning questions
- explicit human approval before provider handoff
- local deterministic fallback when the Cloudflare runtime is not configured

## Portal surfaces

- `/` — Ask Org Brain, specialist activity, RCA and approval
- `/work` — work intelligence and conflicts
- `/incidents` — incident evidence and change context
- `/services` — service catalog and dependencies
- `/graph` — explicit organization relationships
- `/knowledge` — architecture decisions
- `/scenario-lab` — repeatable deterministic failures
- `/history` — D1 investigation history + organization memory search
- `/handoffs` — approved D1-backed provider handoff ledger
- `/evaluations` — hidden-truth RCA regression scoring
- `/architecture` — reviewer-facing system design
- `/runtime` — live Worker/binding health
- `/remediation/[id]` — editable durable remediation draft while an RCA waits for approval

## Architecture

```text
Engineer
  ↓
Next.js + Agent Elements
  ↓
Cloudflare Worker
  ↓
Investigation Workflow
  ↓
D1-backed provider contracts
  ↓
bounded specialists
  ├─ Work
  ├─ Observability
  ├─ Change
  ├─ Dependency
  └─ Knowledge
  ↓
Vectorize / D1 historical memory
  ↓
Workers AI through AI Gateway
  ↓
Durable Object investigation state
  ↓
waitForEvent(human approval)
  ↓
latest editable remediation draft
  ↓
D1 provider handoff ledger
  ↓
historical RCA memory
```

The same specialist/context code runs against mock providers locally and a D1-backed provider implementation in the Cloudflare Workflow. External Azure DevOps, GitHub, Elastic/ClickHouse and deployment adapters remain intentionally outside the demo mutation boundary.

## Investigation flow

For RCA questions the system keeps observation, source attribution and synthesis separate:

```text
query
  ↓
Observability Agent
  → trace / logs / metrics

Change Agent
  → deployment / commit / source

Dependency + Knowledge Agents when relevant
  ↓
RCA Synthesizer
  ↓
Workers AI grounded explanation
  ↓
editable mitigation/remediation draft
  ↓
Workflow waits for approval
  ↓
provider handoff record
  ↓
D1 + Vectorize organizational memory
```

Historical memory is precedent only. It is explicitly prevented from becoming proof that the current incident has the same cause.

## Scenario Lab

The three seeded scenarios have separate traces, logs, metrics, deployments, commits and source snapshots:

1. sequential document validation regression
2. database connection-pool exhaustion
3. retry amplification / cascading dependency failure

Public scenario metadata is separate from `data/scenarios/evaluation.ts`. Runtime agents never import the hidden expected answer.

## Evaluation

`/evaluations` executes the same orchestrator used by the application and scores the resulting RCA against hidden scenario contracts. The browser receives only aggregate rubric results, not the answer key.

Dimensions include evidence coverage, affected-service attribution, deployment attribution, commit/change attribution and causal alignment.

## Cloudflare resources

`wrangler.jsonc` configures:

- `AI` — Workers AI
- `DB` — D1, automatically provisioned by current Wrangler when missing
- `INVESTIGATIONS` — SQLite-backed Durable Object
- `INVESTIGATION_WORKFLOW` — Cloudflare Workflow
- `MEMORY` — Vectorize binding added by the repeatable memory setup command

Models:

```text
@cf/meta/llama-3.3-70b-instruct-fp8-fast
@cf/baai/bge-base-en-v1.5
```

### Worker API

```text
GET   /health
POST  /v1/investigations
GET   /v1/investigations/:id
PATCH /v1/investigations/:id/remediation
POST  /v1/investigations/:id/approval
GET   /v1/history
GET   /v1/memory/search?q=...
GET   /v1/handoffs
```

## Run locally

Install and run the frontend:

```bash
yarn install
yarn dev
```

Start the Cloudflare runtime:

```bash
yarn cf:dev
```

Then configure `.env.local`:

```bash
NEXT_PUBLIC_ORG_BRAIN_API_URL=http://localhost:8787
```

The Ask header and `/runtime` page clearly show whether the browser is using the Cloudflare runtime or local fallback.

## Persistence setup

D1 tables self-initialize at runtime and the SQL migration is also checked in under `migrations/`.

Vectorize setup is repeatable:

```bash
yarn cf:memory:setup
```

The command creates `org-brain-memory` if necessary and adds the `MEMORY` binding to `wrangler.jsonc`.

## Deploy

Authenticate Wrangler and run:

```bash
yarn cf:deploy
```

`cf:deploy` ensures the Vectorize memory resource/binding exists before deploying the Worker. Set `ALLOWED_ORIGIN` to the deployed frontend origin and point the frontend's `NEXT_PUBLIC_ORG_BRAIN_API_URL` at the Worker URL.

## Safety boundary

Org Brain does not silently mutate production systems.

- generated remediation and planning work remain drafts
- remediation can be edited while the Workflow is waiting
- approval is recorded separately from execution
- approved remediation becomes a provider handoff record in D1
- no real rollback or third-party work-item creation happens in the submitted demo

This makes the integration boundary demonstrable without pretending a demo account should be allowed to rearrange production infrastructure for dramatic effect.

## Quality gate

```bash
yarn format
yarn lint
yarn typecheck
yarn build
yarn cf:dev
```

The repository also includes the exact reviewer demo path in [`DEMO-CHECKLIST.md`](./DEMO-CHECKLIST.md).
