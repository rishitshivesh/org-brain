declare module "cloudflare:workers" {
  export interface DurableObjectStorage {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
    deleteAll(): Promise<void>;
  }

  export interface DurableObjectState {
    storage: DurableObjectStorage;
  }

  export class DurableObject<Env = unknown> {
    protected readonly ctx: DurableObjectState;
    protected readonly env: Env;
    constructor(ctx: DurableObjectState, env: Env);
  }

  export interface WorkflowEvent<Payload = unknown> {
    instanceId: string;
    payload: Payload;
  }

  export interface WorkflowStep {
    do<T>(name: string, callback: () => Promise<T> | T): Promise<T>;
    waitForEvent<T = unknown>(
      name: string,
      options: { type: string; timeout?: string | number },
    ): Promise<{ payload: T }>;
  }

  export class WorkflowEntrypoint<Env = unknown, Payload = unknown> {
    protected readonly env: Env;
    run(event: WorkflowEvent<Payload>, step: WorkflowStep): Promise<unknown>;
  }
}
