/**
 * @file compose-table-name.util.ts
 * @module @stackra/nestjs-link/utils
 * @description Generates a deterministic pivot table name from entity names.
 *
 * The table name is derived by:
 * 1. Converting both entity names to snake_case
 * 2. Sorting them alphabetically (for consistency regardless of source/target order)
 * 3. Joining with an underscore
 *
 * This ensures that `defineLink({ source: A, target: B })` and
 * `defineLink({ source: B, target: A })` would produce the same table name,
 * preventing accidental duplicate tables.
 *
 * For self-referencing links, the relation name is appended to avoid collision.
 *
 * @example
 * ```typescript
 * composeTableName('Product', 'SalesChannel');
 * // => 'product_sales_channel'
 *
 * composeTableName('Role', 'Role', 'parents');
 * // => 'role_parents'
 * ```
 */

import { Str } from '@stackra/ts-support';

/**
 * Generates a deterministic pivot table name from entity names.
 *
 * @param sourceName - The source entity class name
 * @param targetName - The target entity class name
 * @param sourceRelation - Optional relation name (for self-referencing links)
 * @returns A snake_case table name
 */
export function composeTableName(
  sourceName: string,
  targetName: string,
  sourceRelation?: string
): string {
  const sourceSnake = Str.snake(sourceName);
  const targetSnake = Str.snake(targetName);

  // Self-referencing link — use relation name to avoid collision
  if (sourceName === targetName && sourceRelation) {
    return `${sourceSnake}_${Str.snake(sourceRelation)}`;
  }

  // Sort alphabetically for deterministic naming
  const names = [sourceSnake, targetSnake].sort();
  return names.join('_');
}
