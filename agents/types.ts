import type { OrgBrainIntent, WorkItemDraft } from "@/types/org-brain";

export type SpecialistAgentId =
  "work" | "observability" | "change" | "dependency" | "knowledge";

export interface AgentToolEvent {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output: unknown;
}

export interface AgentFinding {
  id: string;
  title: string;
  description: string;
  confidence?: number;
  evidence: string[];
  evidenceAgainst?: string[];
}

export interface SpecialistAgentResult {
  agent: SpecialistAgentId;
  summary: string;
  references: string[];
  tools: AgentToolEvent[];
  findings?: AgentFinding[];
}

export interface OrchestrationPlan {
  intent: OrgBrainIntent;
  agents: SpecialistAgentId[];
  reason: string;
}

export interface RcaSynthesis {
  incidentId: string;
  rootCause: string;
  confidence: number;
  evidence: string[];
  evidenceAgainst: string[];
  mitigation: string;
  remediationDraft: WorkItemDraft;
}

export type ApprovalAction = "mitigation" | "remediation";

export interface ApprovalRecord {
  id: string;
  incidentId: string;
  actions: ApprovalAction[];
  status: "approved" | "kept-as-draft";
  recordedAt: string;
}

export interface OrchestrationResult {
  plan: OrchestrationPlan;
  answer: string;
  references: string[];
  runs: SpecialistAgentResult[];
  tools?: AgentToolEvent[];
  rca?: RcaSynthesis;
}
