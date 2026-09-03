/**
 * @file worker-configuration.d.ts
 * @description Typed environment bindings for the {{SLUG}} Worker.
 *   Wrangler's `wrangler types` command regenerates this file from
 *   `wrangler.jsonc`. Every binding (D1, KV, Queue, R2, env vars) is
 *   typed here so `env.BINDING` has full autocomplete.
 *
 *   Run `npx wrangler types` after editing wrangler.jsonc to refresh.
 */

interface Env {
  // Example bindings — uncomment + add module entries in cloud.yaml:
  // DB: D1Database;
  // KV: KVNamespace;
  // QUEUE: Queue;
  // BUCKET: R2Bucket;

  /** Canonical environment identifier. */
  FIGENTRA_ENV: string;
}
