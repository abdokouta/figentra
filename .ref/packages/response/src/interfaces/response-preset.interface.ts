/**
 * @file response-preset.interface.ts
 * @module @stackra/response/src/interfaces
 * @description IResponsePreset interface.
 */

/**
 * Transport-agnostic response preset.
 *
 * Presets define WHAT to include/exclude in responses. Each transport
 * adapter (HTTP interceptor, GraphQL plugin, WebSocket emitter) reads
 * the active preset and applies it according to its own conventions.
 *
 * @example
 * ```typescript
 * const ADMIN_PRESET: IResponsePreset = {
 *   name: 'admin',
 *   includeDebug: true,
 *   includeLinks: true,
 *   includeMeta: true,
 *   includeTracing: true,
 *   stripNulls: false,
 *   flattenSingleItem: false,
 * };
 * ```
 */
export interface IResponsePreset {
  /** Unique preset identifier. */
  name: string;

  // ── Content Control ─────────────────────────────────────────────────────

  /** Include debug information (execution time, SQL count, memory). */
  includeDebug: boolean;

  /** Include HATEOAS links (self, next, prev, related). */
  includeLinks: boolean;

  /** Include metadata (pagination, version, counts). */
  includeMeta: boolean;

  /** Include distributed tracing info (request_id, trace_id, span_id). */
  includeTracing: boolean;

  // ── Payload Shaping ─────────────────────────────────────────────────────

  /** Remove null and undefined values from the response payload. */
  stripNulls: boolean;

  /** Unwrap single-item responses: { data: item } → item directly. */
  flattenSingleItem: boolean;

  /** Maximum nested object depth (undefined = unlimited). */
  maxDepth?: number;

  /** Custom transformers to apply (class references). */
  transformers?: Array<new (...args: any[]) => any>;

  // ── Transport Hints ─────────────────────────────────────────────────────

  /**
   * Transport-specific hints that adapters can interpret.
   *
   * HTTP adapter reads: `renderer`, `cacheControl`, `cors`
   * GraphQL adapter reads: `extensionsKey`, `complexityLimit`
   * WebSocket adapter reads: `compressionLevel`, `batchWindow`
   */
  hints?: Record<string, unknown>;
}
