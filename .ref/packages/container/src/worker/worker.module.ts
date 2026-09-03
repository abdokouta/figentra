import { Global } from "@/core/decorators/global.decorator";
import { Module } from "@/core/decorators/module.decorator";
import { WORKER_RUNTIME_PROVIDERS } from "@/worker/providers/worker-runtime.providers";
import {
  WORKER_CONTEXT,
  WORKER_ENV,
  WORKER_EXECUTION_CONTEXT,
  WORKER_REQUEST,
} from "@/worker/worker.tokens";

/**
 * Standard Cloudflare Worker runtime module.
 *
 * WorkerFactory supplies only the internal runtime context for each request.
 * This global module owns the complete public Worker DI surface and derives
 * each public binding as a request-scoped provider.
 */
@Global()
@Module({
  providers: WORKER_RUNTIME_PROVIDERS,
  exports: [
    WORKER_CONTEXT,
    WORKER_ENV,
    WORKER_REQUEST,
    WORKER_EXECUTION_CONTEXT,
  ],
})
export class WorkerModule {}
