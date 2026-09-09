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

## Scenario review

> Review the seeded incident end to end. Verify timestamps, trace IDs, service relationships, deployment versions, commit references and work-item links are internally consistent, and make the Scenario Lab expose symptoms rather than the hidden RCA.
