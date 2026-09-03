/**
 * Standard runtime tokens exposed by the Cloudflare Worker adapter.
 *
 * The concrete per-request runtime object is deliberately kept behind an
 * internal token. WorkerModule exposes the public, request-scoped bindings
 * from that internal runtime value.
 */
export const WORKER_ENV = Symbol.for("@stackra/container:worker-env");
export const WORKER_REQUEST = Symbol.for("@stackra/container:worker-request");
export const WORKER_EXECUTION_CONTEXT = Symbol.for(
  "@stackra/container:worker-execution-context",
);
export const WORKER_CONTEXT = Symbol.for("@stackra/container:worker-context");

/** Internal bridge token. Applications should use the public tokens above. */
export const WORKER_RUNTIME_CONTEXT = Symbol.for(
  "@stackra/container:worker-runtime-context",
);
