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

export interface D1Result<T> {
  results: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

export interface D1PreparedStatementBinding {
  bind(...values: unknown[]): D1PreparedStatementBinding;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

export interface D1DatabaseBinding {
  prepare(query: string): D1PreparedStatementBinding;
  batch<T = Record<string, unknown>>(
    statements: D1PreparedStatementBinding[],
  ): Promise<D1Result<T>[]>;
}

export interface VectorizeMatchBinding {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface VectorizeBinding {
  upsert(
    vectors: Array<{
      id: string;
      values: number[];
      metadata?: Record<string, string | number | boolean>;
    }>,
  ): Promise<unknown>;
  query(
    vector: number[],
    options: { topK: number; returnMetadata?: "none" | "indexed" | "all" },
  ): Promise<{ matches: VectorizeMatchBinding[] }>;
}

export interface Env {
  AI: AiBinding;
  INVESTIGATIONS: DurableObjectNamespaceBinding;
  INVESTIGATION_WORKFLOW: WorkflowBinding;
  DB?: D1DatabaseBinding;
  MEMORY?: VectorizeBinding;
  AI_MODEL?: string;
  EMBEDDING_MODEL?: string;
  AI_GATEWAY_ID?: string;
  ALLOWED_ORIGIN?: string;
}
