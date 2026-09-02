/**
 * @file registry-cache.service.ts
 * @description Non-authoritative KV cache operations for Registry metadata.
 */
import type { RegistryBindings } from '../interfaces/registry-bindings.interface.js';

/**
 * Invalidates all derived Registry cache entries for an application mutation.
 * D1 remains authoritative; route cache invalidation is best-effort and bounded
 * because registration is a low-frequency control-plane operation.
 */
export async function invalidateRegistryCache(env: RegistryBindings, slug: string): Promise<void> {
  if (!env.REGISTRY_CACHE) return;

  const keys = [
    `application:${slug}`,
    `metadata:${slug}`,
  ];

  let cursor: string | undefined;
  do {
    const page = await env.REGISTRY_CACHE.list({ prefix: 'route:', cursor, limit: 1000 });
    keys.push(...page.keys.map((entry) => entry.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  await Promise.all(keys.map((key) => env.REGISTRY_CACHE!.delete(key)));
}
