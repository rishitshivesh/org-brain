# Org Brain

Org Brain is an engineering intelligence workspace that connects work items, services, repositories, deployments, observability and architectural decisions into one navigable context model.

The project is deliberately programmatic first. Entity relationships are resolved through IDs and graph edges before an LLM is allowed to reason over the resulting context.

## Current milestone

The frontend and deterministic organization model are in place. Agent orchestration is intentionally not connected yet.

Available surfaces:

- `/` — Agent Elements-based Ask workspace preview
- `/work` — Azure DevOps-style work intelligence, filtering and conflict visibility
- `/incidents` — operational incidents linked to traces and deployments
- `/services` — service catalog with ownership, repositories and dependencies
- `/graph` — scoped organization relationship views
- `/knowledge` — architecture decisions and durable engineering context
- `/scenario-lab` — deterministic incident fixture injection

Detail routes currently include work items, incidents and services.

## Data model

The frontend is backed by `data/seed/org-brain.seed.json` and the extensible types in `types/org-brain.ts`.

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

Selectors live in `lib/org-brain.ts` so page components do not manually traverse the raw JSON.

## Agent UI

The repository includes the full Agent Elements chat surface from 21st.dev. The Ask page currently uses the real `AgentChat`, message rendering and prompt suggestions against preview data.

Tool renderers, streaming states, question flows and specialist-agent activity will be wired when the Cloudflare agent runtime is introduced.

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

The next phase introduces provider abstractions and deterministic context builders, followed by Cloudflare Workflows, Workers AI, Durable Objects and Vectorize-backed organization memory.
