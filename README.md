# Org Brain

Org Brain is an engineering intelligence workspace that connects work items, services, repositories, deployments, observability and architectural decisions into one navigable context model.

The project is deliberately programmatic first. Entity relationships are resolved through IDs and graph edges before an LLM is allowed to reason over the resulting context.

## Current milestone

The frontend, mock provider layer, deterministic organization-context builders and five bounded specialist roles are in place.

Incident questions run through separate Observability and Change specialists before RCA synthesis. Dependency and Knowledge specialists are added when a query asks for blast-radius or architecture context. RCA mitigation/remediation actions require an explicit human approval decision in the Agent Elements chat.

The portal interaction layer is also in place: one viewport scroll owner, contained table/chat context scrolling, route-entry motion, staggered surfaces, subtle ambient motion, reduced-motion support, responsive horizontal graph browsing and a working `Cmd/Ctrl + K` command palette.

Available surfaces:

- `/` — Agent Elements-based Ask workspace with specialist activity, RCA synthesis and approval gating
- `/work` — Azure DevOps-style work intelligence, filtering and conflict visibility
- `/incidents` — operational incidents linked to traces and deployments
- `/services` — service catalog with ownership, repositories and dependencies
- `/graph` — scoped organization relationship views
- `/knowledge` — architecture decisions and durable engineering context
- `/scenario-lab` — deterministic incident fixture injection

## Data model

The current frontend is backed by `data/seed/org-brain.seed.json` and the extensible types in `types/org-brain.ts`.

The seed contains a coherent engineering slice across teams, repositories, services, work items, commits, source snapshots, deployments, incidents, traces, logs, metrics and architecture decisions.

## Provider layer

Mock data is exposed through provider contracts under `providers/` rather than consumed directly by the agent layer. Future Azure DevOps, GitHub, Elastic and ClickHouse adapters can replace these mock implementations without changing context-builder APIs.

## Deterministic context

`lib/context-builders.ts` assembles bounded contexts for work planning, service analysis, deployment/change analysis and incident investigation.

The incident builder resolves traces, participating services, deployments, commits, linked work, logs, metrics, architecture decisions and source changes.

## Specialist flow

The local orchestrator caps each query at three specialist runs.

Current specialists:

- Work Agent — requirement impact, conflicts and linked work context
- Observability Agent — traces, logs, metrics and runtime bottleneck localization
- Change Agent — deployment timing, commits, source snapshots and change correlation
- Dependency Agent — explicit upstream/downstream traversal and bounded blast-radius analysis
- Knowledge Agent — durable ADRs and architecture constraints

For incident/RCA queries the core path remains:

```text
query
  ↓
Observability Agent
  ↓
Change Agent
  ↓
RCA Synthesizer
  ↓
mitigation draft + remediation work draft
  ↓
human approval
```

Dependency or Knowledge context is added only when requested. The Change Agent does not read the scenario evaluation answer key.

## Approval boundary

Agent Elements' native Question tool captures approval for mitigation and remediation actions.

Approval and execution are deliberately separate:

- approving remediation prepares the draft for a future provider handoff
- approving mitigation marks it eligible for a future execution provider
- no external work item, rollback or deployment mutation is performed yet

This boundary is intended to become durable Workflow state when Cloudflare orchestration is connected.

## Portal interaction layer

The app shell owns viewport scrolling so long screens do not create nested full-page scrollbars. Tables and side context panels get explicit bounded scroll regions, while graph chains remain horizontally browsable on smaller viewports.

Motion uses the existing CSS/Tailwind stack rather than introducing a runtime animation dependency. Page entry, card stagger, tool activity and scenario state transitions are intentionally subtle and automatically disabled for users requesting reduced motion.

The top bar exposes a keyboard command palette with `Cmd/Ctrl + K` for fast navigation across the same route set used by the sidebar.

## Agent UI

The repository includes the Agent Elements chat surface from 21st.dev. Tool activity is rendered inline for specialist selection, trace/log/metric inspection, deployment and commit analysis, source inspection, dependency traversal, architecture constraints, change correlation, RCA synthesis and approval recording.

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

The local orchestration boundary is broad enough. The next phase should move execution onto Cloudflare Workers AI and Workflows, persist investigation/approval state, and introduce Vectorize-backed historical engineering memory without changing the provider and specialist contracts.
