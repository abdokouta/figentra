/** Minimal structural representation of Cloudflare ExecutionContext. */
export interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?: () => void;
}

/** Application boundary executed for each Worker request. */
export interface WorkerHandler {
  handle(): Response | Promise<Response>;
}

export interface WorkerRequestContext<Env = unknown> {
  readonly request: Request;
  readonly env: Env;
  readonly executionContext: WorkerExecutionContext;
}
