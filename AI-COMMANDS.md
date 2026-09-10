# AI Commands

AI was used as a development assistant while building Org Brain.

This file keeps a small set of representative development commands used for implementation, data generation, debugging and review. It is not intended to contain the complete conversation history.

## Mock organization data

> Generate a small but internally consistent engineering organization dataset for the Org Brain demo. Include teams, repositories, services, Azure DevOps-style work items, deployments, commits and service dependencies. Every relationship should resolve to an existing entity.

## Shell review

> Review the existing Next.js shell without changing the project structure. Fix sidebar layout and navigation issues, keep shadcn components, and make the workspace feel like an internal engineering product rather than a starter template.

## Work-item intelligence

> Improve the seeded work-item view. Resolve team and service names from IDs, surface conflicts, add useful summary counts, filtering, and a detail view without introducing backend state yet.

## Trace visualization

> Build an incident detail view from the seed data. Show the service path, span duration, correlated logs, deployment context, commit context and metric deltas without trying to render every observability field.

## Org context views

> Add service, incident, graph and architecture-decision views from the existing seed relationships. Keep data traversal in shared selectors rather than querying the JSON directly throughout page components.

## Agent UI preparation

> Use the installed Agent Elements AgentChat as the main Ask surface. Keep it on deterministic preview data for now, but structure the page so tool cards, streaming states and agent activity can be connected later without replacing the chat UI.

## Provider abstraction

> Put the mock organization data behind provider contracts for work items, services, repositories, deployments, incidents, observability and architecture. Keep context-building code independent of the mock JSON source.

## Deterministic context builder

> Build bounded work, service, deployment and incident contexts by traversing explicit entity relationships. Do not infer an RCA or architecture recommendation inside the context builder.

## Deterministic Ask queries

> Make a small set of Ask prompts work without an LLM. Resolve work-item conflicts, service dependencies, incident trace/deployment/commit context and deployment changes, then clearly stop before agent reasoning would begin.

## Specialist orchestration

> Add a bounded local orchestrator with separate Work and Observability specialists. Keep runtime evidence analysis separate from source-code attribution, and show specialist activity through Agent Elements tool renderers.

## Incident change correlation

> Add a Change Agent that starts from the correlated deployment, resolves commits and source snapshots, and scores candidate changes from timing and code structure. Do not import the scenario answer key into runtime code.

## RCA synthesis

> Combine Observability and Change findings into a structured RCA with confidence, supporting and contradictory evidence, a mitigation draft, and a remediation work-item draft. Keep both actions draft-only for now.

## Scenario review

> Review the seeded incident end to end. Verify timestamps, trace IDs, service relationships, deployment versions, commit references and work-item links are internally consistent, and keep public scenario metadata separate from the evaluation answer key.
