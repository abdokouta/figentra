/**
 * @file parse-fields-query.util.ts
 * @module @stackra/nestjs-orm/http
 * @description Parses the `?fields=` query parameter into a validated field array
 *   for partial entity loading. Always includes `id`. Ignores invalid field names.
 */

/**
 * Parse a comma-separated fields query parameter into a validated field array.
 *
 * Rules:
 * - Always includes `id` regardless of whether the consumer requests it
 * - Ignores invalid/unknown field names without throwing
 * - Returns `undefined` if no valid fields are requested (load all)
 * - Trims whitespace around field names
 *
 * @param fieldsParam - The raw `?fields=` query parameter value
 * @param validFields - Array of valid field names for the entity
 * @returns Validated field array, or undefined if no selection (load all)
 *
 * @example
 * ```typescript
 * const fields = parseFieldsQuery('name,status,invalid_field', ['id', 'name', 'status', 'price']);
 * // Result: ['id', 'name', 'status']
 * ```
 *
 * @example No fields param:
 * ```typescript
 * const fields = parseFieldsQuery(undefined, ['id', 'name']);
 * // Result: undefined (load all fields)
 * ```
 */
export function parseFieldsQuery(
  fieldsParam: string | undefined,
  validFields: string[]
): string[] | undefined {
  if (!fieldsParam || fieldsParam.trim().length === 0) {
    return undefined;
  }

  const requested = fieldsParam
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
  const valid = requested.filter((f) => validFields.includes(f));

  // Always include 'id'
  if (!valid.includes('id')) {
    valid.unshift('id');
  }

  // If only 'id' remains (no valid user-requested fields), return undefined (load all)
  return valid.length > 1 ? valid : undefined;
}
