import type { InvestigationApprovalInput } from "../types/investigation";

export interface AiBinding {
  run(
    model: string,
    input: Record<string, unknown>,
    options?: {
      gateway?: {
        id: string;
        skipCache?: boolean;
        cacheTtl?: number;
      };
    },
  ): Promise<unknown>;
}

export interface WorkflowInstanceBinding {
  id: string;
  status(): Promise<unknown>;
  sendEvent(event: {
    type: string;
    payload: InvestigationApprovalInput;
  }): Promise<void>;
}

export interface WorkflowBinding {
  create(options: {
    id: string;
    params: {
      investigationId: string;
      query: string;
    };
  }): Promise<WorkflowInstanceBinding>;
  get(id: string): Promise<WorkflowInstanceBinding>;
}

export interface DurableObjectStubBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface DurableObjectNamespaceBinding {
  idFromName(name: string): unknown;
  get(id: unknown): DurableObjectStubBinding;
}

export interface Env {
  AI: AiBinding;
  INVESTIGATIONS: DurableObjectNamespaceBinding;
  INVESTIGATION_WORKFLOW: WorkflowBinding;
  AI_MODEL?: string;
  AI_GATEWAY_ID?: string;
  ALLOWED_ORIGIN?: string;
}
