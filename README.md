# Org Brain

Org Brain is an engineering intelligence workspace that connects work items, services, repositories, deployments, observability and architectural decisions into one navigable context model.

The project is deliberately programmatic first. Entity relationships are resolved through IDs and graph edges before an LLM is allowed to reason over the resulting context.

## Current milestone

The frontend, mock provider layer, deterministic organization-context builders and first bounded specialist-agent flow are in place.

Incident questions now run through separate Observability and Change specialists before an RCA is synthesized. Work-planning questions continue to use the Work Agent. Mitigation and remediation outputs are drafts only.

Available surfaces:

- `/` — Agent Elements-based Ask workspace with specialist activity and RCA synthesis
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

## Agent flow

The local orchestrator is intentionally bounded.

Current specialists:

- Work Agent — requirement impact, conflicts and architecture constraints
- Observability Agent — traces, logs, metrics and runtime bottleneck localization
- Change Agent — deployment timing, commits, source snapshots and change correlation

For incident/RCA queries the flow is:

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
```

The Change Agent does not read the scenario evaluation answer key. It only uses data reachable through the provider/context graph.

## Agent UI

The repository includes the Agent Elements chat surface from 21st.dev. Tool activity is rendered inline for specialist selection, trace/log/metric inspection, deployment and commit analysis, source inspection, change correlation and RCA synthesis.

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

The next phase should introduce approval-aware work/mitigation actions and the remaining Knowledge/Dependency specialists before moving orchestration onto Cloudflare Workflows and Workers AI.
