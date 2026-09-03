/**
 * @file string-filter.input.ts
 * @description GraphQL input type for filtering string fields.
 */

import { Field, InputType } from '@nestjs/graphql';

/**
 * Input type for filtering string fields in queries.
 * Supports equality, contains, starts/ends with, and in-list operations.
 */
@InputType({ description: 'Filter operations for string fields' })
export class StringFilter {
  /** Exact match. */
  @Field(() => String, { nullable: true, description: 'Exact match' })
  eq?: string;

  /** Not equal. */
  @Field(() => String, { nullable: true, description: 'Not equal' })
  ne?: string;

  /** Contains substring (case-insensitive). */
  @Field(() => String, { nullable: true, description: 'Contains substring' })
  contains?: string;

  /** Starts with prefix. */
  @Field(() => String, { nullable: true, description: 'Starts with prefix' })
  startsWith?: string;

  /** Ends with suffix. */
  @Field(() => String, { nullable: true, description: 'Ends with suffix' })
  endsWith?: string;

  /** Value is in the given list. */
  @Field(() => [String], {
    nullable: true,
    description: 'Value is in the given list',
  })
  in?: string[];

  /** Value is not in the given list. */
  @Field(() => [String], {
    nullable: true,
    description: 'Value is not in the given list',
  })
  nin?: string[];
}
