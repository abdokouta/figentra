import { REQUEST_SCOPE } from "@/core/contexts/request/request-scope";
import type { WorkerRequestContext } from "@/worker/interfaces/worker-handler.interface";
import {
  WORKER_CONTEXT,
  WORKER_ENV,
  WORKER_EXECUTION_CONTEXT,
  WORKER_REQUEST,
  WORKER_RUNTIME_CONTEXT,
} from "@/worker/worker.tokens";

/** Standard request-scoped Worker runtime provider definitions. */
export const WORKER_RUNTIME_PROVIDERS = [
  {
    provide: WORKER_CONTEXT,
    scope: REQUEST_SCOPE,
    useFactory: (runtime: WorkerRequestContext) => runtime,
    inject: [WORKER_RUNTIME_CONTEXT],
  },
  {
    provide: WORKER_ENV,
    scope: REQUEST_SCOPE,
    useFactory: (context: WorkerRequestContext) => context.env,
    inject: [WORKER_CONTEXT],
  },
  {
    provide: WORKER_REQUEST,
    scope: REQUEST_SCOPE,
    useFactory: (context: WorkerRequestContext) => context.request,
    inject: [WORKER_CONTEXT],
  },
  {
    provide: WORKER_EXECUTION_CONTEXT,
    scope: REQUEST_SCOPE,
    useFactory: (context: WorkerRequestContext) => context.executionContext,
    inject: [WORKER_CONTEXT],
  },
];
