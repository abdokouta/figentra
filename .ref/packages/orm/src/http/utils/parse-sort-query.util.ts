/**
 * @file parse-sort-query.util.ts
 * @module @stackra/nestjs-orm/http/utils
 * @description Parses sort query parameters from HTTP requests.
 *   Supports comma-separated field names with `-` prefix for descending.
 */

// ============================================================================
// Utility
// ============================================================================

/**
 * Parse a sort query string into an object of field → direction.
 *
 * Format: comma-separated field names, `-` prefix for descending.
 *
 * @param sort - Raw sort query string (e.g., '-createdAt,name').
 * @returns Sort object or undefined if no valid sort fields.
 *
 * @example
 * ```typescript
 * parseSortQuery('-createdAt,name');
 * // → { createdAt: 'desc', name: 'asc' }
 *
 * parseSortQuery('price');
 * // → { price: 'asc' }
 * ```
 */
export function parseSortQuery(sort: any): Record<string, 'asc' | 'desc'> | undefined {
  if (!sort || typeof sort !== 'string') return undefined;

  const fields = sort
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (fields.length === 0) return undefined;

  const result: Record<string, 'asc' | 'desc'> = {};

  for (const field of fields) {
    if (field.startsWith('-')) {
      result[field.slice(1)] = 'desc';
    } else if (field.startsWith('+')) {
      result[field.slice(1)] = 'asc';
    } else {
      result[field] = 'asc';
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
