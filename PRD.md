# Org Brain

## Product Requirements Document

### 1. Overview

Org Brain is an AI coordination layer for engineering organizations.

It connects engineering work, source code, services, deployments, observability data, incidents, ownership, and historical context into a unified model that can be queried and reasoned over.

The system is intentionally **programmatic first and AI second**.

Relationships such as:

- work item → repository
- repository → service
- service → dependency
- deployment → commit
- commit → work item
- trace → service
- incident → trace
- incident → deployment

should be resolved deterministically wherever possible.

AI agents operate only after the relevant organizational context has been assembled.

---

## 2. Problem

Engineering context is fragmented across systems.

A typical organization may store related information across:

- Azure DevOps work items
- Git repositories
- pull requests
- deployment systems
- service catalogs
- ELK
- ClickHouse
- distributed traces
- dashboards
- runbooks
- architecture documentation
- historical incidents

Answering simple questions therefore requires manually joining information across several tools.

Examples:

> What already exists for partial claim settlement?

> Would this proposed change conflict with another workflow?

> Which services will this feature affect?

> Why did claims submission latency increase after the last deployment?

> Which code change most likely caused this incident?

> Has something similar happened before?

Org Brain provides one interface for answering these questions.

---

# 3. Core Principles

## 3.1 Programmatic context before AI reasoning

The LLM should not independently discover arbitrary relationships.

The application should first resolve known relationships using IDs and graph edges.

Example:

```text
Incident
  ↓
Trace
  ↓
Service
  ↓
Deployment
  ↓
Commit
  ↓
Work Item
```

The resulting bounded context is then provided to specialist agents.

---

## 3.2 Explainable findings

Important conclusions must expose supporting evidence.

Instead of:

> The deployment caused the incident.

Return:

```text
Likely root cause: claims-worker v3.19.2

Confidence: 94%

Evidence:
- latency began 6 minutes after deployment
- 83% of affected trace duration is document validation
- consumer processing increased from 42 ms to 890 ms
- commit 8fc19b2 changed document validation execution
- CPU and memory remained within baseline
```

---

## 3.3 Specialist agents

The first version uses a coordinator with focused specialist agents.

### Orchestrator

Understands user intent and coordinates the investigation.

### Knowledge Agent

Retrieves historical incidents, architecture information, decisions and organizational context.

### Work Agent

Finds related work items, requirements, duplicate work and prepares work item drafts.

### Dependency Agent

Traverses services, repositories, dependencies, owners and impacted flows.

### Observability Agent

Analyzes logs, traces, metrics and correlated operational signals.

### Change Agent

Analyzes commits, deployments, releases and work-item relationships.

### Synthesizer

Combines findings into a final answer with evidence and confidence.

---

# 4. Primary Product Modes

## 4.1 Ask Org Brain

The main conversational interface.

Example:

> What needs to change if we support partial settlement for OPD claims?

The system should:

1. understand the requested capability
2. find related work items
3. identify affected services
4. identify prior architectural decisions
5. detect conflicting requirements
6. inspect relevant historical incidents
7. produce recommendations
8. optionally prepare work items

---

# 5. Work Intelligence

Org Brain should understand existing engineering work before suggesting new work.

Example response:

```text
Related work

ADO-3988
All-or-nothing claim settlement validation

ADO-4182
Asynchronous document categorization

ADO-4231
Partial OPD settlement support


Potential conflict

ADO-3988 assumes a settlement request either succeeds
completely or fails completely.


Affected systems

claims-web
claims-api
rules-engine
claims-worker


Suggested change

Extend the current settlement state model instead of
creating a parallel OPD settlement workflow.
```

The user may then select:

**Prepare work items**

Org Brain produces drafts for:

- epic
- feature
- story
- technical task
- remediation item

Work items should remain drafts until explicitly approved.

---

# 6. Production Intelligence

Users can investigate operational issues using mocked observability providers.

Example query:

> Why is claims submission suddenly slow?

The system should programmatically identify:

1. affected endpoint
2. trace IDs
3. participating services
4. slow spans
5. correlated logs
6. relevant deployments
7. commits included in those deployments
8. associated work items
9. similar historical incidents

Specialist agents then analyze the bounded investigation context.

---

# 7. Root Cause Analysis

A completed RCA should include:

## Summary

Concise explanation of what happened.

## Root Cause

The strongest supported cause.

## Confidence

Numerical or categorical confidence.

## Evidence

Signals supporting the conclusion.

## Evidence Against

Signals that contradict competing explanations.

## Timeline

Deployment and incident chronology.

## Affected Systems

Services and dependencies involved.

## Relevant Changes

Deployments, commits and work items.

## Recommended Mitigation

Safest immediate response.

## Follow-up Work

Suggested engineering work items.

---

# 8. Scenario Lab

Because real Azure DevOps, ClickHouse and ELK environments are unavailable in the public project, Org Brain provides a scenario simulator.

Initial scenarios:

- Kafka consumer regression
- database connection exhaustion
- retry storm
- slow downstream dependency
- breaking API contract
- bad feature flag rollout
- memory leak
- cache configuration regression

Selecting a scenario injects consistent mock data across:

- metrics
- traces
- logs
- deployments
- commits
- services
- work items

The RCA system must reconstruct the incident from provider data rather than directly reading the scenario's root-cause definition.

---

# 9. Knowledge Graph

The organization should be represented as connected entities.

## Core entities

### Team

Owns services and repositories.

### Repository

Contains source code and commits.

### Service

Represents a deployable or logical service.

### Work Item

Represents Azure DevOps-like work.

### Commit

Represents source changes.

### Deployment

Represents a deployed release.

### Trace

Represents a distributed request.

### Log

Represents an observable event.

### Incident

Represents a production issue.

### Architecture Decision

Represents an important historical engineering decision.

---

# 10. Core Relationships

```text
Team
  └── owns → Service

Service
  ├── implemented-by → Repository
  ├── calls → Service
  └── deployed-by → Deployment

Work Item
  ├── touches → Service
  ├── implemented-by → Commit
  └── related-to → Work Item

Deployment
  ├── deploys → Service
  └── contains → Commit

Incident
  ├── affects → Service
  ├── contains → Trace
  └── correlated-with → Deployment

Trace
  └── contains → Span

Span
  └── executed-by → Service
```

---

# 11. Data Provider Architecture

External systems should be hidden behind provider interfaces.

```text
providers/
  work-items/
  observability/
  repositories/
  deployments/
  service-catalog/
```

Example:

```ts
interface WorkItemProvider {
  search(query: string): Promise<WorkItem[]>;
  getById(id: string): Promise<WorkItem | null>;
  getRelated(id: string): Promise<WorkItem[]>;
}
```

Mock providers are used initially.

Future adapters may include:

- Azure DevOps
- GitHub
- Elastic
- ClickHouse
- Kubernetes
- ArgoCD

Agent logic must not depend directly on a specific provider.

---

# 12. Frontend

## Navigation

```text
Org Brain

Ask
Work
Incidents
Services
Knowledge
Scenario Lab
```

---

## Ask

Main agent workspace.

Layout:

```text
┌──────────────┬──────────────────────────┬────────────────────┐
│ Navigation   │ Agent Workspace          │ Context            │
│              │                          │                    │
│              │ Conversation             │ Active agents      │
│              │ Tool activity            │ Related entities   │
│              │ Findings                 │ Evidence           │
│              │                          │                    │
└──────────────┴──────────────────────────┴────────────────────┘
```

---

## Work

Displays:

- epics
- features
- stories
- tasks
- bugs
- relationships
- conflicts
- impacted services

---

## Incidents

Displays:

- active incidents
- historical incidents
- severity
- affected services
- RCA status
- related deployment
- confidence

---

## Services

Service catalog displaying:

- owner
- repository
- dependencies
- deployment
- health
- active incidents
- related work

---

## Knowledge

Displays:

- architectural decisions
- historical incidents
- work-item context
- stored engineering knowledge

---

## Scenario Lab

Allows deterministic incident injection.

Example:

```text
Kafka Consumer Regression

Service
claims-worker

Difficulty
Medium

Signals
Logs
Traces
Metrics
Deployment
Code Change

[Inject Scenario]
```

The root cause must not be displayed before investigation.

---

# 13. Graph Visualization

Graph visualization is an important product surface.

The same graph renderer should display different contexts.

Planning:

```text
Feature
  ↓
Work Items
  ↓
Services
  ↓
Repositories
```

Incident:

```text
Trace
  ↓
Services
  ↓
Deployment
  ↓
Commit
  ↓
Work Item
```

Nodes should support inspection and expansion rather than rendering the entire organization simultaneously.

---

# 14. Initial Mock Integrations

## Azure DevOps

Mock:

- epics
- features
- stories
- tasks
- bugs
- relationships
- states
- owners
- tags

## Observability

Mock:

- ELK-style logs
- ClickHouse trace records
- metrics
- trace IDs
- span IDs

## Source Control

Mock:

- repositories
- commits
- changed files
- commit messages
- linked work items

## Deployments

Mock:

- environment
- version
- commit SHA
- service
- timestamp
- status

---

# 15. AI Architecture

The first implementation should avoid autonomous infinite agent loops.

A request should follow a bounded workflow:

```text
User Query
   ↓
Intent Classification
   ↓
Programmatic Context Resolution
   ↓
Specialist Agent Selection
   ↓
Parallel Specialist Analysis
   ↓
Evidence Cross-check
   ↓
Synthesis
   ↓
Response
```

Maximum specialist count and LLM calls should be explicitly bounded.

---

# 16. Cloudflare Mapping

Future production implementation:

### Workers AI

LLM inference.

### Cloudflare Workflows

Durable orchestration of specialist agents.

### Durable Objects

Conversation and investigation state.

### D1

Structured organizational graph and operational data.

### Vectorize

Semantic retrieval of:

- historical RCAs
- work-item descriptions
- architecture decisions
- runbooks
- documentation

### AI Gateway

Inference observability and control.

---

# 17. Demo Story A: Work Planning

User asks:

> We need partial settlements for OPD claims. What already exists and what needs to change?

Org Brain should discover:

- existing settlement feature
- existing all-or-nothing validation
- rules-engine ownership
- claims-api dependency
- historical related incident

It identifies a conflict and proposes an implementation approach.

The user selects:

**Prepare work items**

The system creates draft work-item hierarchy.

---

# 18. Demo Story B: Incident RCA

User enters Scenario Lab.

Selects:

**Kafka consumer regression**

Scenario creates a production incident.

The user asks:

> Why is claims submission slow?

Org Brain:

1. follows the trace
2. identifies services
3. correlates deployment
4. finds related commits
5. checks relevant code changes
6. compares historical incidents
7. produces RCA

Expected finding:

```text
claims-worker v3.19.2

Commit
8fc19b2

Likely cause
Sequential document validation introduced in the
consumer processing path.

Confidence
94%
```

The user selects:

**Prepare remediation work**

Org Brain creates a draft engineering work item.

---

# 19. Initial Scope

The first usable version should contain:

- mock organization data
- service graph
- work-item browser
- incident browser
- scenario simulator
- trace visualization
- deployment history
- commit context
- agent workspace
- deterministic context builder
- mocked agent responses where AI is not yet connected

The frontend should be usable before Cloudflare services are introduced.

---

# 20. Non-goals for Initial Version

Do not initially implement:

- authentication
- organization tenancy
- real Azure DevOps credentials
- real Elastic credentials
- Kubernetes access
- production rollback
- automatic work-item creation
- unrestricted autonomous agents
- large-scale vector ingestion

These can be added after the core organizational reasoning model works.

---

# 21. Success Criteria

The demo is successful when a reviewer can:

1. understand the organization's architecture
2. inspect work-item relationships
3. ask a planning question
4. see conflicting existing work detected
5. generate a sensible work-item draft
6. inject a fake production incident
7. follow the trace across services
8. correlate the incident with a deployment and commit
9. receive an evidence-backed RCA
10. create remediation work from that RCA

The system should feel like engineering infrastructure with AI embedded into it, not an AI chat interface with engineering screenshots attached.