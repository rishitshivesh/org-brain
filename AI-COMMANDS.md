# AI Commands

AI was used as a development assistant while building Org Brain.

This file keeps a representative set of development prompts used for implementation, data generation, debugging and review. It is not intended to reproduce the complete conversation history.

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

> Expand Scenario Lab from one canonical latency case into multiple internally consistent production incidents. Give each failure mode its own incident, traces, logs, metrics, deployment, commit, source snapshot and hidden evaluation truth. Keep every reference resolvable.

## Generalized change correlation

> Make Change Agent score more than one code smell. Detect sequential awaited work, undersized database-pool configuration and aggressive retry configuration from source snapshots, while preserving deployment timing and affected-service evidence.

## Failure-mode RCA synthesis

> Generate a different mitigation and remediation draft for sequential hot-path work, database capacity regression and retry amplification. Do not return the claims-worker remediation text for unrelated incidents.

## Scenario-guided demo UX

> Give each seeded Scenario Lab fixture a strong investigation prompt that can be copied into Ask. Keep the hidden answer key separate and make incident drill-down expose trace operations, log metadata, metric regressions, deployment context and suspect source code.

## RCA evaluation harness

> Build a server-only evaluation harness for seeded RCAs. Compare generated evidence, service attribution, deployment attribution, source-change attribution and causal concepts against hidden scenario contracts, but return only aggregate rubric scores to the browser.

## Evaluation Lab

> Add a reviewer-facing Evaluation Lab that runs all seeded incidents through the same orchestrator and displays benchmark scores across the hidden rubric. Do not expose expected root-cause wording or private evaluation IDs in client code.

## Architecture and runtime surfaces

> Add in-app Architecture and Runtime views. Explain the deterministic-first agent architecture, provider boundaries and Cloudflare execution path, and let Runtime health-check the configured Worker so reviewers can verify the active bindings.

## D1-backed providers and durable history

> Replace Cloudflare's seed-only provider path with a D1-backed implementation that preserves the existing provider interfaces. Persist investigation history and provider handoffs without making agents depend directly on D1.

## Organizational memory

> Add historical engineering memory for prior RCAs, architecture decisions and work items. Use Vectorize in production, keep historical similarity as precedent rather than causal evidence, and make memory failure non-fatal to investigation execution.

## Human-editable remediation

> Let a reviewer edit generated remediation title, description and acceptance criteria while the Workflow is waiting for approval. Persist the latest draft and make the resumed Workflow read that latest durable version before preparing a provider handoff.

## Work-package generation

> Extend planning intelligence so implementation-oriented work queries can return a structured draft feature plus per-service stories and acceptance criteria, while remaining behind the provider handoff boundary.

## Edge and security topology

> Expand the organization graph beyond application services. Add WAF, NGINX/edge gateway, identity, Redis, Kafka and audit/telemetry relationships so dependency analysis can explain complete request and event paths.

## WAF incident scenario

> Add a deterministic WAF false-positive incident in which legitimate multipart document uploads are blocked before NGINX or claims-api. Include deployment, policy source, trace/log/metric evidence, hidden evaluation truth, and a mitigation that narrows the rule instead of disabling WAF broadly.

## NGINX incident scenario

> Add a deterministic edge-timeout incident where NGINX returns 504 before a supported claims request finishes downstream. Correlate the proxy timeout configuration, application completion evidence and the exact WAF-to-NGINX-to-API path.

## Engineering flows

> Add a reviewer-facing Flows surface generated from the explicit dependency graph. Show representative synchronous, asynchronous, authentication and audit paths rather than hard-coded architecture artwork disconnected from provider data.

## Vectorize local-development failure

> The local Cloudflare investigation fails because the MEMORY Vectorize binding requires remote execution. Separate local and production Wrangler configuration so local Worker, Workflow, Durable Object and D1 can run without a Vectorize binding while production still uses Vectorize.

## D1 memory fallback hardening

> Local historical memory fails with SQLite 'LIKE or GLOB pattern too complex' on long natural-language investigation prompts. Remove complex LIKE/GLOB matching from the fallback path, fetch a bounded recent history window and rank token relevance in Worker code instead.

## Submission review

> Perform a final submission sweep. Do not add new product subsystems. Verify the reviewer docs match the implemented five-scenario WAF/NGINX-aware system, local and production Cloudflare configurations are described correctly, hidden evaluation truth remains server-only, and the final runbook prioritizes format, lint, typecheck, build and smoke testing.
