/**
 * @file get-nested-value.util.ts
 * @module @stackra/config/core/utils
 * @description Dot-notation access for deeply nested object properties.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Get a nested value from an object using dot notation.
 *
 * Splits the path on `'.'` and walks the object tree. Returns
 * `defaultValue` if any segment along the path is `null` or `undefined`.
 *
 * @typeParam T - Expected return type
 * @param obj - Source object to traverse
 * @param path - Dot-notated path (e.g., `'database.host'`)
 * @param defaultValue - Fallback value if the path is not found
 * @returns The value at the given path, or `defaultValue`
 *
 * @example
 * ```typescript
 * const config = { database: { host: 'localhost', port: 5432 } };
 * getNestedValue(config, 'database.host');       // 'localhost'
 * getNestedValue(config, 'database.port');       // 5432
 * getNestedValue(config, 'database.name', 'app'); // 'app'
 * ```
 */
export function getNestedValue<T = unknown>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return (current !== undefined ? current : defaultValue) as T | undefined;
}
