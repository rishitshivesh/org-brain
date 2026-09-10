# Org Brain

Org Brain is an engineering intelligence workspace that connects work items, services, repositories, deployments, observability and architectural decisions into one navigable context model.

The project is deliberately programmatic first. Entity relationships are resolved through IDs and graph edges before a model is allowed to reason over the resulting context.

> **Reviewer shortcuts:** start with [`SUBMISSION.md`](./SUBMISSION.md) for the architecture and assignment framing, then use [`DEMO-CHECKLIST.md`](./DEMO-CHECKLIST.md) for the exact 3–5 minute demo path. Representative AI-assisted development prompts are documented in [`AI-COMMANDS.md`](./AI-COMMANDS.md).

## Current milestone

The frontend, mock provider layer, deterministic organization-context builders, five bounded specialist roles and the Cloudflare investigation runtime are now in place.

Incident questions run through separate Observability and Change specialists before RCA synthesis. Dependency and Knowledge specialists are added when a query asks for blast-radius or architecture context. RCA mitigation/remediation actions require an explicit human approval decision in the Agent Elements chat.

When `NEXT_PUBLIC_ORG_BRAIN_API_URL` is configured, the Ask workspace starts a durable Cloudflare investigation instead of executing the local orchestrator directly. The Worker starts a Workflow, stores investigation state in a Durable Object, resolves deterministic engineering context, optionally grounds the final answer with Workers AI through AI Gateway, then pauses RCA investigations for approval. Without the runtime URL, the existing local path remains available for frontend development.

The portal interaction layer is also in place: one viewport scroll owner, contained table/chat context scrolling, route-entry motion, staggered surfaces, subtle ambient motion, reduced-motion support, responsive horizontal graph browsing and a working `Cmd/Ctrl + K` command palette.

Available surfaces:

- `/` — Agent Elements-based Ask workspace with specialist activity, durable investigations, RCA synthesis and approval gating
- `/work` — Azure DevOps-style work intelligence, filtering and conflict visibility
- `/incidents` — operational incidents linked to traces and deployments
- `/services` — service catalog with ownership, repositories and dependencies
- `/graph` — scoped organization relationship views
- `/knowledge` — architecture decisions and durable engineering context
- `/scenario-lab` — deterministic incident fixture injection

## Data model

The current engineering dataset is backed by `data/seed/org-brain.seed.json` and the extensible types in `types/org-brain.ts`.

The seed contains a coherent engineering slice across teams, repositories, services, work items, commits, source snapshots, deployments, incidents, traces, logs, metrics and architecture decisions.

Investigation lifecycle types live in `types/investigation.ts` and deliberately remain separate from organization entities.

## Provider layer

Mock organization data is exposed through provider contracts under `providers/` rather than consumed directly by the agent layer. Future Azure DevOps, GitHub, Elastic and ClickHouse adapters can replace these implementations without changing context-builder or specialist APIs.

## Deterministic context

`lib/context-builders.ts` assembles bounded contexts for work planning, service analysis, deployment/change analysis and incident investigation.

The incident builder resolves traces, participating services, deployments, commits, linked work, logs, metrics, architecture decisions and source changes. These relationships are resolved before Workers AI sees the evidence.

## Specialist flow

The orchestrator caps each query at three specialist runs.

Current specialists:

- Work Agent — requirement impact, conflicts and linked work context
- Observability Agent — traces, logs, metrics and runtime bottleneck localization
- Change Agent — deployment timing, commits, source snapshots and change correlation
- Dependency Agent — explicit upstream/downstream traversal and bounded blast-radius analysis
- Knowledge Agent — durable ADRs and architecture constraints

For incident/RCA queries the core path is:

```text
query
  ↓
Cloudflare Worker
  ↓
Investigation Workflow
  ↓
deterministic context + specialist execution
  ↓
Workers AI synthesis through AI Gateway
  ↓
RCA + mitigation/remediation drafts
  ↓
Workflow waits for human approval
  ↓
approval event resumes workflow
  ↓
provider handoff eligibility only
```

The Change Agent does not read the scenario evaluation answer key. Workers AI receives compact structured evidence and is instructed not to manufacture IDs, metrics or causal claims.

## Cloudflare runtime

The Worker entrypoint is `cloudflare/index.ts` and its infrastructure is defined in `wrangler.jsonc`.

Bindings:

- `AI` — Workers AI
- `INVESTIGATIONS` — SQLite-backed Durable Object namespace using `InvestigationStateObject`
- `INVESTIGATION_WORKFLOW` — `InvestigationWorkflow`

The runtime exposes:

```text
GET  /health
POST /v1/investigations
GET  /v1/investigations/:id
POST /v1/investigations/:id/approval
```

`POST /v1/investigations` returns an investigation ID immediately. The frontend polls the durable state until an orchestration result is available. RCA investigations then remain in `waiting-approval` until the approval endpoint sends the `rca-approval` event to the Workflow.

Approval and execution remain separate. A completed approval can mark mitigation as eligible or prepare a remediation draft, but this runtime does not roll back a deployment or mutate an external work tracker.

### Run the Worker locally

Authenticate Wrangler first if required, then run:

```bash
yarn cf:dev
```

The checked-in minimal `cloudflare/runtime-types.d.ts` keeps the repository type surface independent of a permanent Wrangler dependency. When using Wrangler locally, generated binding types can be refreshed with:

```bash
yarn cf:types
```

### Connect the Next.js frontend

Copy `.env.example` to `.env.local` and point the frontend at the Worker:

```bash
NEXT_PUBLIC_ORG_BRAIN_API_URL=http://localhost:8787
```

Restart `yarn dev`. The Ask header will show `Cloudflare` when the remote runtime is enabled and `Local` when it is not.

For a deployed frontend, update `ALLOWED_ORIGIN` in the Worker environment/config to the actual frontend origin rather than the localhost default.

### Deploy

```bash
yarn cf:deploy
```

After deployment, set the frontend's `NEXT_PUBLIC_ORG_BRAIN_API_URL` to the Worker origin.

The default model configured in `wrangler.jsonc` is:

```text
@cf/meta/llama-3.3-70b-instruct-fp8-fast
```

AI Gateway uses the configured `AI_GATEWAY_ID` (`default` initially) and caching is skipped for investigation synthesis so operational answers are not accidentally reused across incidents.

## Approval boundary

Agent Elements' native Question tool captures approval for mitigation and remediation actions.

With Cloudflare enabled, the browser sends the selected actions to the Worker. The Worker forwards them to the existing Workflow instance as an event, and the UI waits until durable state confirms completion before showing the investigation as completed.

Without Cloudflare enabled, the same UI continues to use the local approval boundary for development.

## Portal interaction layer

The app shell owns viewport scrolling so long screens do not create nested full-page scrollbars. Tables and side context panels get explicit bounded scroll regions, while graph chains remain horizontally browsable on smaller viewports.

Motion uses the existing CSS/Tailwind stack rather than introducing a runtime animation dependency. Page entry, card stagger, tool activity and scenario state transitions are intentionally subtle and automatically disabled for users requesting reduced motion.

The top bar exposes a keyboard command palette with `Cmd/Ctrl + K` for fast navigation across the same route set used by the sidebar.

## Agent UI

The repository includes the Agent Elements chat surface from 21st.dev. Tool activity is rendered inline for durable Workflow start, specialist selection, trace/log/metric inspection, deployment and commit analysis, source inspection, dependency traversal, architecture constraints, change correlation, RCA synthesis and approval recording.

## Scenario model

Public scenario metadata lives separately from scenario evaluation data. The Scenario Lab imports only symptoms and observable fixture information; the expected RCA/evidence answer key remains isolated for later evaluation.

## Development

```bash
yarn install
yarn dev
```

Quality checks:

```bash
yarn format
yarn lint
yarn typecheck
yarn build
```

## Next milestone

The next phase is persistence and retrieval beyond a single investigation: D1-backed structured organization/investigation data, Vectorize-backed historical RCA/ADR/runbook memory, and a small number of additional coherent Scenario Lab fixtures. External provider writes should remain mocked until the end-to-end approval path has been exercised against the deployed runtime.
