# Org Brain

Org Brain is an engineering intelligence workspace that connects work items, services, repositories, deployments, observability and architectural decisions into one navigable context model.

The project is deliberately programmatic first. Entity relationships are resolved through IDs and graph edges before an LLM is allowed to reason over the resulting context.

## Current milestone

The frontend, mock provider layer, deterministic context builders and the first bounded specialist agents are in place. Cloudflare runtime orchestration is not connected yet.

Available surfaces:

- `/` — Agent Elements-based Ask workspace with deterministic orchestration
- `/work` — Azure DevOps-style work intelligence, filtering and conflict visibility
- `/incidents` — operational incidents linked to traces and deployments
- `/services` — service catalog with ownership, repositories and dependencies
- `/graph` — scoped organization relationship views
- `/knowledge` — architecture decisions and durable engineering context
- `/scenario-lab` — deterministic incident fixture injection

Detail routes currently include work items, incidents and services.

## Data model

The current frontend is backed by `data/seed/org-brain.seed.json` and the extensible types in `types/org-brain.ts`.

The seed contains a coherent engineering slice across teams, repositories, services, work items, commits, deployments, incidents, traces, logs, metrics and architecture decisions.

## Provider layer

Mock data is exposed through provider contracts under `providers/` rather than consumed directly by the agent layer.

Future Azure DevOps, GitHub, Elastic and ClickHouse adapters can replace the mock implementations without changing context-builder or specialist-agent APIs.

## Deterministic context

`lib/context-builders.ts` assembles bounded contexts for work planning, service analysis, deployment/change analysis and incident investigation.

The incident builder resolves traces, participating services, deployments, commits, linked work, logs, metrics and architecture decisions. It deliberately keeps context assembly separate from specialist analysis.

## Specialist agents

The first local specialist layer lives under `agents/`.

- **Work Agent** resolves related work, impacted services, requirement conflicts and architecture constraints.
- **Observability Agent** analyzes traces, warning/error logs and metric regressions to localize runtime bottlenecks.
- **Orchestrator** selects at most two specialists for a query and falls back to the deterministic query resolver when no specialist is needed.

The Observability Agent intentionally stops before attributing a runtime issue to source code. Deployment and commit attribution will belong to the Change Agent.

## Scenario model

Public scenario metadata lives separately from scenario evaluation data. The Scenario Lab only imports symptoms and observable fixture information; the expected RCA/evidence answer key is reserved for later server-side evaluation.

## Agent UI

The repository includes the full Agent Elements chat surface from 21st.dev. The Ask page uses the real `AgentChat`, message rendering, suggestions and custom tool renderers for specialist activity.

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

The next phase adds the Change Agent and cross-agent synthesis, then moves orchestration onto Cloudflare Workflows and Workers AI with Durable Objects and Vectorize-backed organization memory.
