import type { Type } from "@stackra/contracts";
import { WorkerAdapter } from "@/worker/worker-adapter";
import { WorkerApplication } from "@/worker/worker.application";
import type { WorkerFactoryOptions } from "@/worker/interfaces/worker-factory-options.interface";
import type { WorkerExecutionContext } from "@/worker/interfaces/worker-handler.interface";

/** Thin Cloudflare Worker runtime adapter for @stackra/container. */
export class WorkerFactory {
  private constructor() {}

  public static create<Env = unknown>(
    rootModule: Type,
    options: WorkerFactoryOptions,
  ): { fetch(request: Request, env: Env, executionContext: WorkerExecutionContext): Promise<Response> } {
    const application = new WorkerApplication(rootModule, options);
    const adapter = new WorkerAdapter<Env>(application, options);

    return {
      fetch: (request, env, executionContext) =>
        adapter.fetch(request, env, executionContext),
    };
  }
}
