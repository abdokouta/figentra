/**
 * @file parse-include-query.util.ts
 * @module @stackra/nestjs-orm/http
 * @description Parses the `?include=` query parameter into a validated populate array
 *   for dynamic relation inclusion. Validates top-level relations against entity metadata
 *   and limits nesting depth.
 */

/** Default maximum include depth (levels of dot-notation nesting). */
const DEFAULT_MAX_DEPTH = 3;

/**
 * Parse a comma-separated include query parameter into a validated populate array.
 *
 * Rules:
 * - Validates that the top-level relation name exists in the valid relations set
 * - Supports dot-notation for nested relations (e.g., `posts.comments`)
 * - Limits nesting depth to `maxDepth` levels (default: 3)
 * - Ignores invalid relation names without throwing
 * - Returns `undefined` if no valid relations are requested
 *
 * @param includeParam - The raw `?include=` query parameter value
 * @param validRelations - Array of valid top-level relation names
 * @param maxDepth - Maximum allowed nesting depth (default: 3)
 * @returns Validated populate array, or undefined if nothing to include
 *
 * @example
 * ```typescript
 * const include = parseIncludeQuery(
 *   'posts,author.profile,invalid_rel',
 *   ['posts', 'author', 'category'],
 *   3
 * );
 * // Result: ['posts', 'author.profile']
 * ```
 *
 * @example Depth limiting:
 * ```typescript
 * const include = parseIncludeQuery(
 *   'posts.comments.author.profile',
 *   ['posts'],
 *   2
 * );
 * // Result: [] (4 levels exceeds maxDepth=2)
 * ```
 */
export function parseIncludeQuery(
  includeParam: string | undefined,
  validRelations: string[],
  maxDepth?: number
): string[] | undefined {
  if (!includeParam || includeParam.trim().length === 0) {
    return undefined;
  }

  const max = maxDepth ?? DEFAULT_MAX_DEPTH;
  const requested = includeParam
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  const validated = requested.filter((relation) => {
    const segments = relation.split('.');
    const depth = segments.length;

    // Check depth limit
    if (depth > max) return false;

    // Validate the top-level relation name
    const topLevel = segments[0];
    if (!topLevel) return false;

    return validRelations.includes(topLevel);
  });

  return validated.length > 0 ? validated : undefined;
}
