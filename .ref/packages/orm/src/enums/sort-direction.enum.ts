/**
 * @file sort-direction.enum.ts
 * @description Defines the sort direction enum used in query sorting.
 */

import { registerEnumType } from '@nestjs/graphql';

/**
 * Sort direction for ordering query results.
 */
export enum SortDirection {
  /** Ascending order (A-Z, 0-9, oldest first). */
  ASC = 'ASC',

  /** Descending order (Z-A, 9-0, newest first). */
  DESC = 'DESC',
}

registerEnumType(SortDirection, {
  name: 'SortDirection',
  description: 'Sort direction for ordering query results',
});
