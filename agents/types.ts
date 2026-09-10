import type { OrgBrainIntent } from "@/types/org-brain";

export type SpecialistAgentId = "work" | "observability";

export interface AgentToolEvent {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output: unknown;
}

export interface SpecialistAgentResult {
  agent: SpecialistAgentId;
  summary: string;
  references: string[];
  tools: AgentToolEvent[];
}

export interface OrchestrationPlan {
  intent: OrgBrainIntent;
  agents: SpecialistAgentId[];
  reason: string;
}

export interface OrchestrationResult {
  plan: OrchestrationPlan;
  answer: string;
  references: string[];
  runs: SpecialistAgentResult[];
}
