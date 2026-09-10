import type { ApprovalAction, ApprovalRecord, OrchestrationResult } from "../agents";

export type InvestigationStatus =
  | "queued"
  | "running"
  | "waiting-approval"
  | "completed"
  | "failed";

export interface InvestigationAiMetadata {
  model: string;
  gatewayId: string;
  used: boolean;
  fallbackReason?: string;
}

export interface InvestigationHandoff {
  mitigationEligible: boolean;
  remediationPrepared: boolean;
  execution: "not-executed";
}

export interface InvestigationState {
  id: string;
  query: string;
  status: InvestigationStatus;
  workflowInstanceId?: string;
  result?: OrchestrationResult;
  approval?: ApprovalRecord;
  handoff?: InvestigationHandoff;
  ai?: InvestigationAiMetadata;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvestigationInput {
  query: string;
}

export interface InvestigationApprovalInput {
  actions: ApprovalAction[];
}

export interface InvestigationResponse {
  runtime: "cloudflare";
  investigation: InvestigationState;
}
