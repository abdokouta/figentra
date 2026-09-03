import type { WorkerRequestContext } from "@/worker/interfaces/worker-handler.interface";

/** Normalized Cloudflare Worker runtime context exposed through DI. */
export type WorkerContext<Env = unknown> = WorkerRequestContext<Env>;
