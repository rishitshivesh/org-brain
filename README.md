# Org Brain

Org Brain is an AI-powered engineering intelligence workspace that connects work items, services, repositories, deployments, traces, logs, metrics, incidents, architecture decisions and operational history into one coordinated context model.

The design rule is simple: **programmatic first, AI second**. Explicit relationships are resolved through provider contracts and graph edges before Workers AI is allowed to reason over the resulting evidence.

> **Reviewer shortcuts:** start with [`SUBMISSION.md`](./SUBMISSION.md), use [`DEMO-CHECKLIST.md`](./DEMO-CHECKLIST.md) for the demo path, and see [`AI-COMMANDS.md`](./AI-COMMANDS.md) for representative AI-assisted development prompts.

## What is implemented

- Next.js portal using Agent Elements
- Work, incidents, services, graph, flows, knowledge, Scenario Lab, history, handoffs, evaluations, architecture and runtime surfaces
- five deterministic incident evidence packs covering application, database, dependency, WAF and NGINX failure modes
- five bounded specialists: Work, Observability, Change, Dependency and Knowledge
- evidence-backed RCA synthesis with hidden-truth evaluation
- Cloudflare Worker API
- Cloudflare Workflows orchestration and `waitForEvent` approval pause/resume
- Durable Object per-investigation state
- D1-backed organization provider adapter, investigation history and provider-handoff ledger
- Vectorize organizational memory for prior RCAs, ADRs and work items in production
- D1-backed local history retrieval when Vectorize is intentionally absent from local Wrangler configuration
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
- `/flows` — end-to-end request/event paths across WAF, NGINX, APIs, Kafka, identity, audit and downstream services
- `/knowledge` — architecture decisions
- `/scenario-lab` — repeatable deterministic failures
- `/history` — D1 investigation history + organization memory search
- `/handoffs` — approved D1-backed provider handoff ledger
- `/evaluations` — hidden-truth RCA regression scoring
- `/architecture` — reviewer-facing system design
- `/runtime` — live Worker/binding health and memory bootstrap control
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

The same specialist/context code runs against provider interfaces in every environment. The Cloudflare Workflow uses the D1-backed provider implementation; the frontend can still use the deterministic seed-backed provider when no remote runtime URL is configured. External Azure DevOps, GitHub, Elastic/ClickHouse and deployment adapters remain intentionally outside the demo mutation boundary.

## Engineering topology

The seeded organization now includes application and platform layers rather than a single claims service chain. Representative paths include:

```text
Internet
  ↓
WAF
  ↓
NGINX / edge gateway
  ↓
claims-web
  ↓
claims-api
  ├─ rules-engine
  ├─ document-service
  ├─ identity-service
  ├─ Redis
  ├─ Kafka
  └─ audit / telemetry

Kafka
  ↓
claims-worker
  ↓
document-service
```

`/flows` renders these paths from the same dependency graph used by the Dependency Agent.

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

Five seeded scenarios have independent traces, logs, metrics, deployments, commits, source snapshots and hidden evaluation contracts:

1. `INC-2409` — sequential document validation regression
2. `INC-2417` — database connection-pool exhaustion
3. `INC-2424` — retry amplification / cascading dependency failure
4. `INC-2431` — WAF false-positive blocking legitimate document uploads
5. `INC-2438` — NGINX proxy timeout returning 504 while the application completes

Public scenario metadata is separate from `data/scenarios/evaluation.ts`. Runtime agents never import the hidden expected answer.

## Evaluation

`/evaluations` executes the same orchestrator used by the application and scores the resulting RCA against hidden scenario contracts. The browser receives only aggregate rubric results, not the answer key.

Dimensions include evidence coverage, affected-service attribution, deployment attribution, commit/change attribution and causal alignment.

## Cloudflare resources

Production `wrangler.jsonc` configures:

- `AI` — Workers AI
- `DB` — D1
- `INVESTIGATIONS` — SQLite-backed Durable Object
- `INVESTIGATION_WORKFLOW` — Cloudflare Workflow
- `MEMORY` — Vectorize

Local `wrangler.local.jsonc` deliberately omits Vectorize because Vectorize has no local emulator. Local history/memory behavior falls back to D1 while Workers AI remains a remote binding.

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
POST  /v1/memory/bootstrap
GET   /v1/handoffs
```

## Run locally

Install dependencies and initialize local D1:

```bash
yarn install
yarn cf:d1:local
yarn cf:dev
```

`cf:dev` uses `wrangler.local.jsonc`, so local development does **not** require a Vectorize binding.

Configure `.env.local`:

```bash
NEXT_PUBLIC_ORG_BRAIN_API_URL=http://localhost:8787
```

Then run the frontend:

```bash
yarn dev
```

The Ask header and `/runtime` page clearly show whether the browser is using the Cloudflare runtime or local fallback.

## Production memory + deploy

Vectorize setup is repeatable:

```bash
yarn cf:memory:setup
```

The command creates `org-brain-memory` if necessary and keeps the production `MEMORY` binding in `wrangler.jsonc`.

Apply remote D1 migrations and deploy:

```bash
yarn cf:d1:remote
yarn cf:deploy
```

Set `ALLOWED_ORIGIN` to the deployed frontend origin and point the frontend's `NEXT_PUBLIC_ORG_BRAIN_API_URL` at the Worker URL.

After deployment, `/runtime` can bootstrap ADR/work-item organizational vectors once. Normal investigation requests do not repeatedly rebuild the organization-memory index.

## Safety boundary

Org Brain does not silently mutate production systems.

- generated remediation and planning work remain drafts
- remediation can be edited while the Workflow is waiting
- approval is recorded separately from execution
- approved remediation becomes a provider handoff record in D1
- no real rollback or third-party work-item creation happens in the submitted demo

## Quality gate

```bash
yarn format
yarn lint
yarn typecheck
yarn build
```

Then smoke-test the Worker separately with `yarn cf:dev` and follow [`DEMO-CHECKLIST.md`](./DEMO-CHECKLIST.md).
