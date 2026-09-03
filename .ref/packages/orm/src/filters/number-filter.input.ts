/**
 * @file number-filter.input.ts
 * @description GraphQL input type for filtering number fields.
 */

import { Field, Float, InputType } from '@nestjs/graphql';

/**
 * Input type for filtering number fields in queries.
 * Supports equality, comparison, and range operations.
 */
@InputType({ description: 'Filter operations for number fields' })
export class NumberFilter {
  /** Exact match. */
  @Field(() => Float, { nullable: true, description: 'Exact match' })
  eq?: number;

  /** Not equal. */
  @Field(() => Float, { nullable: true, description: 'Not equal' })
  ne?: number;

  /** Greater than. */
  @Field(() => Float, { nullable: true, description: 'Greater than' })
  gt?: number;

  /** Greater than or equal. */
  @Field(() => Float, { nullable: true, description: 'Greater than or equal' })
  gte?: number;

  /** Less than. */
  @Field(() => Float, { nullable: true, description: 'Less than' })
  lt?: number;

  /** Less than or equal. */
  @Field(() => Float, { nullable: true, description: 'Less than or equal' })
  lte?: number;

  /** Value is in the given list. */
  @Field(() => [Float], {
    nullable: true,
    description: 'Value is in the given list',
  })
  in?: number[];

  /** Value is not in the given list. */
  @Field(() => [Float], {
    nullable: true,
    description: 'Value is not in the given list',
  })
  nin?: number[];
}
