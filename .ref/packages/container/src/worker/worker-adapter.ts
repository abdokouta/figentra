import { WorkerApplication } from "@/worker/worker.application";
import { WORKER_RUNTIME_CONTEXT } from "@/worker/worker.tokens";
import type { WorkerFactoryOptions } from "@/worker/interfaces/worker-factory-options.interface";
import type { WorkerExecutionContext, WorkerHandler } from "@/worker/interfaces/worker-handler.interface";

/**
 * Thin adapter between Cloudflare's fetch contract and the Stackra request
 * context. It intentionally does not implement routing or HTTP semantics.
 */
export class WorkerAdapter<Env = unknown> {
  public constructor(
    private readonly application: WorkerApplication,
    private readonly options: WorkerFactoryOptions,
  ) {}

  public async fetch(
    request: Request,
    env: Env,
    executionContext: WorkerExecutionContext,
  ): Promise<Response> {
    const app = await this.application.getApplication();
    const workerContext = { request, env, executionContext };
    const requestContext = app.createRequestContext([
      [WORKER_RUNTIME_CONTEXT, workerContext],
    ]);

    try {
      const handler = await requestContext.get<WorkerHandler>(this.options.handler);
      return await handler.handle();
    } finally {
      await requestContext.close();
    }
  }
}
