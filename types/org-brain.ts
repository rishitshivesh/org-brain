/* ============================================================
 * Shared primitives
 * ============================================================
 */

export type EntityId = string;

export type TeamId = EntityId;
export type RepositoryId = EntityId;
export type ServiceId = EntityId;
export type WorkItemId = EntityId;
export type CommitSha = string;
export type DeploymentId = EntityId;
export type IncidentId = EntityId;
export type TraceId = EntityId;
export type SpanId = EntityId;
export type LogId = EntityId;
export type ArchitectureDecisionId = EntityId;

export type ISODateString = string;

export type EntityStatus =
    | "active"
    | "inactive"
    | "deprecated"
    | "unknown";

/* ============================================================
 * Organization
 * ============================================================
 */

export interface Organization {
    id: EntityId;
    name: string;
}

/* ============================================================
 * Teams
 * ============================================================
 */

export interface Team {
    id: TeamId;
    name: string;
    description?: string;
    status?: EntityStatus;
}

/* ============================================================
 * Repositories
 * ============================================================
 */

export type RepositoryLanguage =
    | "TypeScript"
    | "JavaScript"
    | "Java"
    | "Go"
    | "Python"
    | "C#"
    | "Rust"
    | "Other";

export interface Repository {
    id: RepositoryId;
    name: string;
    ownerTeamId: TeamId;

    defaultBranch: string;

    language?: RepositoryLanguage;
    framework?: string;

    url?: string;
    description?: string;

    status?: EntityStatus;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Services
 * ============================================================
 */

export type ServiceType =
    | "frontend"
    | "api"
    | "service"
    | "worker"
    | "gateway"
    | "database"
    | "queue"
    | "job"
    | "other";

export interface Service {
    id: ServiceId;
    name: string;

    repositoryId?: RepositoryId;
    ownerTeamId: TeamId;

    type: ServiceType;

    description?: string;

    runtime?: string;
    environment?: string[];

    tags?: string[];

    status?: EntityStatus;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Service dependencies
 * ============================================================
 */

export type DependencyProtocol =
    | "HTTP"
    | "HTTPS"
    | "gRPC"
    | "Kafka"
    | "WebSocket"
    | "TCP"
    | "Database"
    | "Internal"
    | string;

export interface ServiceDependency {
    from: ServiceId;
    to: ServiceId;

    protocol: DependencyProtocol;

    topic?: string;
    endpoint?: string;

    description?: string;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Work items
 * ============================================================
 */

export type WorkItemType =
    | "Epic"
    | "Feature"
    | "Story"
    | "Task"
    | "Bug"
    | "Spike"
    | "Issue"
    | "Other";

export type WorkItemState =
    | "Proposed"
    | "New"
    | "Active"
    | "Blocked"
    | "Investigating"
    | "Resolved"
    | "Done"
    | "Closed"
    | string;

export interface WorkItem {
    id: WorkItemId;

    type: WorkItemType;
    title: string;
    state: WorkItemState;

    description?: string;

    parentId?: WorkItemId;

    ownerTeamId?: TeamId;
    assignee?: string;

    tags?: string[];

    relatedServiceIds?: ServiceId[];
    relatedRepositoryIds?: RepositoryId[];
    relatedWorkItemIds?: WorkItemId[];

    conflictsWith?: WorkItemId[];
    dependsOn?: WorkItemId[];
    blocks?: WorkItemId[];

    acceptanceCriteria?: string[];

    createdAt?: ISODateString;
    updatedAt?: ISODateString;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Commits
 * ============================================================
 */

export interface Commit {
    sha: CommitSha;

    repositoryId: RepositoryId;

    message: string;
    author: string;

    timestamp: ISODateString;

    workItemIds?: WorkItemId[];

    changedFiles?: string[];

    additions?: number;
    deletions?: number;

    parentShas?: CommitSha[];

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Source snapshots
 * ============================================================
 */

export interface SourceSnapshot {
    repositoryId: RepositoryId;
    commitSha: CommitSha;

    path: string;
    content: string;

    language?: RepositoryLanguage | string;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Deployments
 * ============================================================
 */

export type DeploymentEnvironment =
    | "local"
    | "dev"
    | "development"
    | "qa"
    | "uat"
    | "staging"
    | "production"
    | "prod"
    | string;

export type DeploymentStatus =
    | "Queued"
    | "Running"
    | "Succeeded"
    | "Failed"
    | "RolledBack"
    | "Cancelled"
    | string;

export interface Deployment {
    id: DeploymentId;

    serviceId: ServiceId;

    environment: DeploymentEnvironment;

    version?: string;

    commitShas: CommitSha[];

    status: DeploymentStatus;

    deployedAt: ISODateString;

    completedAt?: ISODateString;

    triggeredBy?: string;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Incidents
 * ============================================================
 */

export type IncidentSeverity =
    | "SEV1"
    | "SEV2"
    | "SEV3"
    | "SEV4"
    | "Unknown";

export type IncidentStatus =
    | "Detected"
    | "Investigating"
    | "Mitigating"
    | "Monitoring"
    | "Resolved"
    | "Closed"
    | string;

export interface Incident {
    id: IncidentId;

    title: string;

    description?: string;

    severity: IncidentSeverity;
    status: IncidentStatus;

    startedAt: ISODateString;

    resolvedAt?: ISODateString;

    affectedServiceIds: ServiceId[];

    traceIds?: TraceId[];

    correlatedDeploymentIds?: DeploymentId[];

    workItemIds?: WorkItemId[];

    tags?: string[];

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Traces
 * ============================================================
 */

export type TraceStatus =
    | "ok"
    | "error"
    | "unset"
    | string;

export interface Trace {
    id: TraceId;

    name: string;

    startedAt: ISODateString;

    durationMs: number;

    status: TraceStatus;

    spans: TraceSpan[];

    attributes?: Record<string, unknown>;
}

export interface TraceSpan {
    id: SpanId;

    parentSpanId?: SpanId;

    serviceId: ServiceId;

    operation: string;

    durationMs: number;

    status: TraceStatus;

    startedAt?: ISODateString;

    attributes?: Record<string, unknown>;
}

/* ============================================================
 * Logs
 * ============================================================
 */

export type LogLevel =
    | "trace"
    | "debug"
    | "info"
    | "warn"
    | "error"
    | "fatal";

export interface LogEntry {
    id: LogId;

    timestamp: ISODateString;

    serviceId: ServiceId;

    level: LogLevel;

    message: string;

    traceId?: TraceId;
    spanId?: SpanId;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Metrics
 * ============================================================
 */

export interface MetricPoint {
    timestamp: ISODateString;
    value: number;
}

export interface MetricSeries {
    id?: EntityId;

    serviceId: ServiceId;

    metric: string;

    unit?: string;

    points: MetricPoint[];

    metadata?: Record<string, unknown>;
}

export interface MetricComparison {
    serviceId: ServiceId;

    metric: string;

    before: number;
    after: number;

    unit?: string;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Architecture decisions
 * ============================================================
 */

export type ArchitectureDecisionStatus =
    | "Proposed"
    | "Accepted"
    | "Rejected"
    | "Deprecated"
    | "Superseded";

export interface ArchitectureDecision {
    id: ArchitectureDecisionId;

    title: string;

    status: ArchitectureDecisionStatus;

    summary: string;

    context?: string;
    decision?: string;
    consequences?: string[];

    relatedServiceIds?: ServiceId[];

    relatedRepositoryIds?: RepositoryId[];

    relatedWorkItemIds?: WorkItemId[];

    supersedes?: ArchitectureDecisionId;
    supersededBy?: ArchitectureDecisionId;

    createdAt?: ISODateString;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Org graph
 * ============================================================
 */

export type OrgBrainEntityType =
    | "organization"
    | "team"
    | "repository"
    | "service"
    | "work-item"
    | "commit"
    | "deployment"
    | "incident"
    | "trace"
    | "architecture-decision";

export interface OrgBrainEntityReference {
    type: OrgBrainEntityType;
    id: EntityId;
}

export type OrgBrainRelationshipType =
    | "owns"
    | "implements"
    | "depends-on"
    | "calls"
    | "touches"
    | "deployed-by"
    | "contains"
    | "implemented-by"
    | "affects"
    | "correlated-with"
    | "related-to"
    | "conflicts-with"
    | "resolved-by"
    | "supersedes"
    | string;

export interface OrgBrainRelationship {
    id?: EntityId;

    from: OrgBrainEntityReference;
    to: OrgBrainEntityReference;

    type: OrgBrainRelationshipType;

    label?: string;

    metadata?: Record<string, unknown>;
}

/* ============================================================
 * Root seed structure
 * ============================================================
 */

export interface OrgBrainData {
    organization: Organization;

    teams: Team[];

    repositories: Repository[];

    services: Service[];

    serviceDependencies: ServiceDependency[];

    workItems: WorkItem[];

    commits: Commit[];

    sourceSnapshots: SourceSnapshot[];

    deployments: Deployment[];

    incidents: Incident[];

    traces: Trace[];

    logs: LogEntry[];

    /**
     * Keep this as MetricComparison for the initial seed.
     * Later, production observability can move to MetricSeries.
     */
    metrics: MetricComparison[];

    architectureDecisions: ArchitectureDecision[];

    relationships?: OrgBrainRelationship[];
}

/* ============================================================
 * Derived / UI view models
 * ============================================================
 */

export interface ServiceContext {
    service: Service;

    team?: Team;

    repository?: Repository;

    upstreamServices: Service[];
    downstreamServices: Service[];

    deployments: Deployment[];

    workItems: WorkItem[];

    incidents: Incident[];
}

export interface WorkItemContext {
    workItem: WorkItem;

    parent?: WorkItem;

    children: WorkItem[];

    conflicts: WorkItem[];

    dependencies: WorkItem[];

    services: Service[];

    repositories: Repository[];

    architectureDecisions: ArchitectureDecision[];
}

export interface IncidentContext {
    incident: Incident;

    services: Service[];

    traces: Trace[];

    deployments: Deployment[];

    commits: Commit[];

    logs: LogEntry[];

    metrics: MetricComparison[];

    workItems: WorkItem[];

    architectureDecisions: ArchitectureDecision[];
}

/* ============================================================
 * Agent context
 * ============================================================
 */

export type OrgBrainIntent =
    | "general-query"
    | "work-planning"
    | "impact-analysis"
    | "incident-investigation"
    | "root-cause-analysis"
    | "work-item-generation"
    | "service-analysis";

export interface OrgBrainQuery {
    query: string;

    intent?: OrgBrainIntent;

    context?: OrgBrainEntityReference[];

    conversationId?: string;
}

export interface AgentEvidence {
    id: EntityId;

    type:
        | "work-item"
        | "service"
        | "trace"
        | "span"
        | "log"
        | "metric"
        | "deployment"
        | "commit"
        | "source"
        | "architecture-decision";

    referenceId: EntityId;

    summary: string;

    relevance?: number;
}

export interface AgentFinding {
    id: EntityId;

    title: string;
    description: string;

    confidence?: number;

    evidence: AgentEvidence[];

    contradictions?: AgentEvidence[];

    relatedEntities?: OrgBrainEntityReference[];
}

/* ============================================================
 * RCA
 * ============================================================
 */

export interface RootCauseAnalysis {
    incidentId: IncidentId;

    summary: string;

    rootCause: string;

    confidence: number;

    evidence: AgentEvidence[];

    evidenceAgainst?: AgentEvidence[];

    affectedServiceIds: ServiceId[];

    deploymentIds?: DeploymentId[];

    commitShas?: CommitSha[];

    workItemIds?: WorkItemId[];

    mitigation?: string;

    followUpWork?: WorkItemDraft[];

    generatedAt: ISODateString;
}

/* ============================================================
 * Draft work items
 * ============================================================
 */

export interface WorkItemDraft {
    type: WorkItemType;

    title: string;

    description: string;

    parentId?: WorkItemId;

    tags?: string[];

    relatedServiceIds?: ServiceId[];

    acceptanceCriteria?: string[];

    rationale?: string;

    sourceReferences?: OrgBrainEntityReference[];
}

/* ============================================================
 * Providers
 * ============================================================
 */

export interface WorkItemProvider {
    list(): Promise<WorkItem[]>;

    getById(id: WorkItemId): Promise<WorkItem | null>;

    search(query: string): Promise<WorkItem[]>;

    getRelated(id: WorkItemId): Promise<WorkItem[]>;

    createDraft(input: WorkItemDraft): Promise<WorkItemDraft>;
}

export interface RepositoryProvider {
    list(): Promise<Repository[]>;

    getById(id: RepositoryId): Promise<Repository | null>;

    getCommit(
        repositoryId: RepositoryId,
        sha: CommitSha,
    ): Promise<Commit | null>;

    getSourceSnapshot(
        repositoryId: RepositoryId,
        sha: CommitSha,
        path: string,
    ): Promise<SourceSnapshot | null>;
}

export interface ServiceCatalogProvider {
    list(): Promise<Service[]>;

    getById(id: ServiceId): Promise<Service | null>;

    getDependencies(id: ServiceId): Promise<ServiceDependency[]>;
}

export interface DeploymentProvider {
    getById(id: DeploymentId): Promise<Deployment | null>;

    getForService(serviceId: ServiceId): Promise<Deployment[]>;

    getAroundTime(
        serviceId: ServiceId,
        timestamp: ISODateString,
    ): Promise<Deployment[]>;
}

export interface ObservabilityProvider {
    getTrace(id: TraceId): Promise<Trace | null>;

    getLogsByTrace(id: TraceId): Promise<LogEntry[]>;

    getLogsByService(
        serviceId: ServiceId,
        options?: {
            from?: ISODateString;
            to?: ISODateString;
        },
    ): Promise<LogEntry[]>;

    getMetrics(serviceId: ServiceId): Promise<MetricComparison[]>;
}

export interface ArchitectureProvider {
    list(): Promise<ArchitectureDecision[]>;

    getById(
        id: ArchitectureDecisionId,
    ): Promise<ArchitectureDecision | null>;

    getForService(
        serviceId: ServiceId,
    ): Promise<ArchitectureDecision[]>;
}