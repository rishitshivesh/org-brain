# AI Commands

AI was used as a development assistant while building Org Brain.

This file keeps a small set of representative development commands used for implementation, data generation, debugging and review. It is not intended to contain the complete conversation history.

## Mock organization data

> Generate a small but internally consistent engineering organization dataset for the Org Brain demo. Include teams, repositories, services, Azure DevOps-style work items, deployments, commits and service dependencies. Every relationship should resolve to an existing entity.

## Incident scenario generation

> Add a deterministic Kafka consumer regression scenario for claims-worker. Generate traces, logs, deployment context and code changes that all point to the same underlying incident without putting the root cause directly in the observable data.

## Graph cleanup

> Review the organization graph data and remove relationships that do not contribute to planning, impact analysis or incident investigation. Keep the graph understandable with a small seed dataset.

## Work-item intelligence

> Given the mock work-item dataset, identify an existing requirement that conflicts with partial OPD settlement. Add enough context that the UI can explain why the conflict exists and which services are affected.

## Trace visualization

> Create a reusable trace visualization component using the existing shadcn design system. It should show service boundaries, span duration and errors without rendering every trace field.

## RCA context builder

> Implement a deterministic context builder that starts from an incident, follows its traces to services, resolves deployments and commits, and returns bounded context for the RCA agent.

## Provider abstraction

> Refactor mock work-item and observability access behind provider interfaces so Azure DevOps, Elastic or ClickHouse integrations can replace the mock implementations later without changing agent code.

## Scenario review

> Review the seeded incident end to end. Verify timestamps, trace IDs, service relationships, deployment versions, commit references and work-item links are internally consistent.