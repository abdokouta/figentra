/**
 * @file flatten.util.ts
 * @module @stackra/config/core/utils
 * @description Utility functions for flattening nested objects to dot-notation
 *   and unflattening flat maps back to nested objects.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Flatten
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Flatten a nested object into a flat key-value map using dot-notation.
 *
 * Arrays are flattened using numeric indices (e.g., `servers.0.host`).
 * Non-object values at leaf nodes are stringified.
 *
 * @param obj - The nested object to flatten
 * @param prefix - Optional prefix for recursive calls (internal use)
 * @returns A flat `Record<string, string>` with dot-notation keys
 *
 * @example
 * ```typescript
 * flatten({ database: { host: 'localhost', port: 5432 } });
 * // { 'database.host': 'localhost', 'database.port': '5432' }
 *
 * flatten({ servers: ['a', 'b'] });
 * // { 'servers.0': 'a', 'servers.1': 'b' }
 * ```
 */
export function flatten(obj: Record<string, unknown>, prefix: string = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result[fullKey] = '';
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const itemKey = `${fullKey}.${i}`;
        const item = value[i];
        if (item !== null && typeof item === 'object') {
          Object.assign(result, flatten(item as Record<string, unknown>, itemKey));
        } else {
          result[itemKey] = String(item ?? '');
        }
      }
    } else if (typeof value === 'object') {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }

  return result;
}

// ════════════════════════════════════════════════════════════════════════════════
// Unflatten
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Reconstruct a nested object from a flat dot-notation key-value map.
 *
 * Numeric path segments are treated as array indices.
 *
 * @param flatMap - A flat `Record<string, string>` with dot-notation keys
 * @returns The reconstructed nested object
 *
 * @example
 * ```typescript
 * unflatten({ 'database.host': 'localhost', 'database.port': '5432' });
 * // { database: { host: 'localhost', port: '5432' } }
 *
 * unflatten({ 'servers.0': 'a', 'servers.1': 'b' });
 * // { servers: ['a', 'b'] }
 * ```
 */
export function unflatten(flatMap: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flatMap)) {
    const parts = key.split('.');
    setNestedPath(result, parts, value);
  }

  return result;
}

// ════════════════════════════════════════════════════════════════════════════════
// Private Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Set a value in a nested object by path segments.
 *
 * @param obj - The target object to mutate
 * @param parts - Array of path segments
 * @param value - The value to set at the deepest level
 */
function setNestedPath(obj: Record<string, unknown>, parts: string[], value: unknown): void {
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    const nextPart = parts[i + 1]!;
    const isNextNumeric = /^\d+$/.test(nextPart);

    if (!(part in current)) {
      current[part] = isNextNumeric ? [] : {};
    }

    const next = current[part];
    if (Array.isArray(next)) {
      current = next as unknown as Record<string, unknown>;
    } else if (typeof next === 'object' && next !== null) {
      current = next as Record<string, unknown>;
    } else {
      // Overwrite primitive with object
      const replacement = isNextNumeric ? [] : {};
      current[part] = replacement;
      current = replacement as unknown as Record<string, unknown>;
    }
  }

  const lastPart = parts[parts.length - 1]!;
  if (Array.isArray(current)) {
    const index = parseInt(lastPart, 10);
    (current as unknown[])[index] = value;
  } else {
    current[lastPart] = value;
  }
}
