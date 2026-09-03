/**
 * @file date-filter.input.ts
 * @description GraphQL input type for filtering date fields.
 */

import { Field, InputType } from '@nestjs/graphql';

/**
 * Input type for filtering date fields in queries.
 * Supports equality, comparison, and range operations.
 */
@InputType({ description: 'Filter operations for date fields' })
export class DateFilter {
  /** Exact match. */
  @Field(() => Date, { nullable: true, description: 'Exact match' })
  eq?: Date;

  /** Not equal. */
  @Field(() => Date, { nullable: true, description: 'Not equal' })
  ne?: Date;

  /** After (greater than). */
  @Field(() => Date, { nullable: true, description: 'After (greater than)' })
  gt?: Date;

  /** After or equal (greater than or equal). */
  @Field(() => Date, {
    nullable: true,
    description: 'After or equal (greater than or equal)',
  })
  gte?: Date;

  /** Before (less than). */
  @Field(() => Date, { nullable: true, description: 'Before (less than)' })
  lt?: Date;

  /** Before or equal (less than or equal). */
  @Field(() => Date, {
    nullable: true,
    description: 'Before or equal (less than or equal)',
  })
  lte?: Date;
}
