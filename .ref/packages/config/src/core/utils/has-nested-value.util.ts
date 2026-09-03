/**
 * @file has-nested-value.util.ts
 * @module @stackra/config/core/utils
 * @description Checks if a dot-notated path exists in a nested object.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Check if a nested path exists in an object.
 *
 * Walks the object tree using dot-notation. Returns `false` if any
 * segment is `null`, `undefined`, or the key is not present via `in`.
 *
 * @param obj - Source object to traverse
 * @param path - Dot-notated path (e.g., `'database.host'`)
 * @returns `true` if every segment of the path exists
 *
 * @example
 * ```typescript
 * const config = { database: { host: 'localhost' } };
 * hasNestedValue(config, 'database.host');  // true
 * hasNestedValue(config, 'database.port');  // false
 * hasNestedValue(config, 'cache.driver');   // false
 * ```
 */
export function hasNestedValue(obj: Record<string, unknown>, path: string): boolean {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    if (!(key in (current as object))) {
      return false;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return true;
}
