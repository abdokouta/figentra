/**
 * @file boolean-filter.input.ts
 * @description GraphQL input type for filtering boolean fields.
 */

import { Field, InputType } from '@nestjs/graphql';

/**
 * Input type for filtering boolean fields in queries.
 * Supports equality check.
 */
@InputType({ description: 'Filter operations for boolean fields' })
export class BooleanFilter {
  /** Exact match. */
  @Field(() => Boolean, { nullable: true, description: 'Exact match' })
  eq?: boolean;
}
