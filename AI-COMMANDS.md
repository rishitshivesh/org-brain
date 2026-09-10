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

> Combine Observability and Change findings into a structured RCA with confidence, supporting and contradictory evidence, a mitigation draft, and a remediation work-item draft. Keep both actions draft-only until explicitly approved.

## Dependency analysis

> Add a Dependency Agent that traverses explicit service edges up to a bounded depth, reports upstream callers and downstream blast radius, and never infers graph links that are not present in the service catalog.

## Architecture knowledge

> Add a Knowledge Agent that resolves relevant ADRs and architecture constraints for work items, incidents and services. Keep durable recorded decisions separate from generated recommendations.

## Approval boundary

> Use Agent Elements' Question tool to gate RCA mitigation and remediation actions. Record the selected approval locally, prepare remediation for provider handoff only after approval, and keep approval distinct from external execution.

## Portal interaction pass

> Make the portal feel fluid without adding another animation dependency. Give the application one clear scroll owner, contain long tables and side panels, add subtle route and staggered surface motion, respect reduced-motion preferences, and improve hover/focus feedback across primary engineering views.

## Global navigation

> Add a keyboard-driven command palette for moving between Org Brain surfaces. Keep it consistent with the current sidebar routes and make the visible keyboard affordance functional rather than decorative.

## Scenario interaction polish

> Improve Scenario Lab so fixture injection has visible state change and motion while keeping the hidden evaluation answer key outside the client path.

## Cloudflare investigation runtime

> Move the investigation boundary onto Cloudflare without rewriting the existing providers or specialist contracts. Add a Worker API, a durable per-investigation state holder, and a Workflow that runs deterministic context resolution before any model synthesis.

## Workers AI grounding

> Use Llama 3.3 on Workers AI only as a grounded synthesis layer over structured specialist findings. Route inference through AI Gateway, keep temperature low, skip response caching for incident synthesis, and fall back to the deterministic answer if inference fails.

## Durable approval resume

> Pause RCA investigations inside the Cloudflare Workflow until an explicit approval event arrives. Resume the same workflow instance after approval, persist the final decision, and keep mitigation/remediation handoff eligibility separate from external execution.

## Remote Ask integration

> Make the Agent Elements Ask workspace use the Cloudflare investigation API when a runtime URL is configured, while preserving the local orchestrator as a development fallback. Show runtime/investigation state and do not mark approval complete until durable state confirms it.

## Multi-scenario evidence packs

> Expand Scenario Lab from one canonical latency case into three internally consistent production incidents. Add a database connection-pool regression and a retry-amplification cascade with their own incidents, traces, logs, metrics, deployments, commits, source snapshots and hidden evaluation truth. Keep every reference resolvable.

## Generalized change correlation

> Make Change Agent score more than one code smell. Detect sequential awaited work, undersized database-pool configuration and aggressive retry configuration from source snapshots, while preserving deployment timing and affected-service evidence.

## Failure-mode RCA synthesis

> Generate a different mitigation and remediation draft for sequential hot-path work, database capacity regression and retry amplification. Do not return the claims-worker remediation text for unrelated incidents.

## Scenario-guided demo UX

> Give each seeded Scenario Lab fixture a strong investigation prompt that can be copied into Ask. Keep the hidden answer key separate and make incident drill-down expose trace operations, log metadata, metric regressions, deployment context and suspect source code.

## Scenario review

> Review the seeded incidents end to end. Verify timestamps, trace IDs, service relationships, deployment versions, commit references and work-item links are internally consistent, and keep public scenario metadata separate from the evaluation answer key.
