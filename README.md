# Org Brain

Org Brain is an engineering intelligence workspace that connects work items, services, repositories, deployments, observability and architectural decisions into one navigable context model.

The project is deliberately programmatic first. Entity relationships are resolved through IDs and graph edges before an LLM is allowed to reason over the resulting context.

## Current milestone

The frontend, mock provider layer and deterministic organization-context builders are in place. Agent orchestration is intentionally not connected yet.

Available surfaces:

- `/` — Agent Elements-based Ask workspace with deterministic organization queries
- `/work` — Azure DevOps-style work intelligence, filtering and conflict visibility
- `/incidents` — operational incidents linked to traces and deployments
- `/services` — service catalog with ownership, repositories and dependencies
- `/graph` — scoped organization relationship views
- `/knowledge` — architecture decisions and durable engineering context
- `/scenario-lab` — deterministic incident fixture injection

Detail routes currently include work items, incidents and services.

## Data model

The current frontend is backed by `data/seed/org-brain.seed.json` and the extensible types in `types/org-brain.ts`.

The seed contains a coherent engineering slice across:

- teams
- repositories
- services and dependencies
- Azure DevOps-style work items
- commits and source snapshots
- deployments
- incidents
- traces and logs
- metrics
- architecture decisions

## Provider layer

Mock data is exposed through provider contracts under `providers/` rather than consumed directly by the context layer.

Current providers cover:

- work items
- repositories and source snapshots
- services and dependencies
- deployments
- incidents
- observability
- architecture decisions

Future Azure DevOps, GitHub, Elastic and ClickHouse adapters can replace these mock implementations without changing context-builder APIs.

## Deterministic context

`lib/context-builders.ts` assembles bounded contexts for:

- work planning
- service analysis
- deployment/change analysis
- incident investigation

The incident builder resolves traces, participating services, deployments, commits, linked work, logs, metrics and architecture decisions. It deliberately does not infer the final RCA.

`lib/query-resolver.ts` proves this layer from the Ask page with a few deterministic questions before an LLM is introduced.

## Scenario model

Public scenario metadata lives separately from scenario evaluation data. The Scenario Lab only imports symptoms and observable fixture information; the expected RCA/evidence answer key is reserved for later server-side evaluation.

## Agent UI

The repository includes the full Agent Elements chat surface from 21st.dev. The Ask page uses the real `AgentChat`, message rendering and prompt suggestions.

The same surface will later host specialist-agent tool cards, streaming states, questions and approval flows.

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

The next phase introduces the orchestrator and bounded specialist agents over these deterministic contexts, followed by Cloudflare Workflows, Workers AI, Durable Objects and Vectorize-backed organization memory.
