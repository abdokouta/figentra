/**
 * @file parse-filter-query.util.ts
 * @module @stackra/nestjs-orm/http/utils
 * @description Parses filter query parameters from HTTP requests.
 *   Supports JSON string or nested object query params.
 */

// ============================================================================
// Utility
// ============================================================================

/**
 * Parse filter query parameter into a filter object.
 *
 * Supports two formats:
 * - JSON string: `?filter={"status":"active","name":{"contains":"foo"}}`
 * - Nested object: `?filter[status]=active&filter[name][contains]=foo`
 *
 * @param filter - Raw filter query parameter.
 * @returns Parsed filter object or undefined.
 */
export function parseFilterQuery(filter: any): Record<string, any> | undefined {
  if (!filter) return undefined;

  // Already an object (parsed by NestJS query pipe or express)
  if (typeof filter === 'object') return filter;

  // JSON string
  if (typeof filter === 'string') {
    try {
      return JSON.parse(filter);
    } catch {
      return undefined;
    }
  }

  return undefined;
}
