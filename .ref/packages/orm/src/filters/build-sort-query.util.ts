/**
 * @file build-sort-query.util.ts
 * @description Converts GraphQL sort input objects into MikroORM-compatible
 * orderBy objects.
 */

import { ISortDirection } from '../enums/sort-direction.enum';

/**
 * Sort input shape: { field: ISortDirection }
 */
type SortInput = Record<string, ISortDirection>;

/**
 * Converts a sort input object into a MikroORM orderBy clause.
 * Maps ISortDirection enum values to MikroORM's QueryOrder format.
 *
 * @param sort - The GraphQL sort input object (e.g., { createdAt: 'DESC' }).
 * @returns A MikroORM-compatible orderBy object.
 *
 * @example
 * const orderBy = buildSortQuery({ createdAt: ISortDirection.DESC });
 * // { createdAt: 'DESC' }
 */
export function buildSortQuery(sort: SortInput | undefined): Record<string, string> {
  if (sort == null) return {};

  const orderBy: Record<string, string> = {};

  for (const [field, direction] of Object.entries(sort)) {
    if (direction) {
      orderBy[field] = direction;
    }
  }

  return orderBy;
}
