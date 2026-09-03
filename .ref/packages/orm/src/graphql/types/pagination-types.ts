/**
 * @file pagination-types.ts
 * @module @stackra/nestjs-orm/graphql/types
 * @description GraphQL ObjectType factories for paginated responses.
 *   Creates named Page, SimplePage, and Connection types per entity.
 */

import { IType } from '@nestjs/common';
import { ObjectType, Field, Int } from '@nestjs/graphql';

// ============================================================================
// Abstract Base Types
// ============================================================================

/** Offset-based pagination metadata. */
@ObjectType({ isAbstract: true })
class PaginationMeta {
  @Field(() => Int) public total!: number;
  @Field(() => Int) public page!: number;
  @Field(() => Int) public limit!: number;
  @Field(() => Int) public totalPages!: number;
  @Field(() => Int) public count!: number;
  @Field(() => Boolean) public hasNextPage!: boolean;
  @Field(() => Boolean) public hasPreviousPage!: boolean;
}

/** Cursor-based page info (Relay spec). */
@ObjectType({ isAbstract: true })
class PageInfo {
  @Field(() => Boolean) public hasNextPage!: boolean;
  @Field(() => Boolean) public hasPreviousPage!: boolean;
  @Field(() => String, { nullable: true }) public startCursor?: string | null;
  @Field(() => String, { nullable: true }) public endCursor?: string | null;
}

// ============================================================================
// Factories
// ============================================================================

/**
 * Create a GraphQL Page type for offset-based pagination.
 *
 * @param classRef - The entity class (must have `@ObjectType()` applied).
 * @returns An abstract ObjectType with `items` and `meta` fields.
 */
export function createPageType<T>(classRef: IType<T>): IType<any> {
  @ObjectType({ isAbstract: true })
  abstract class PageType {
    @Field(() => [classRef]) public items!: T[];
    @Field(() => PaginationMeta) public meta!: PaginationMeta;
  }
  return PageType as IType<any>;
}

/**
 * Create a GraphQL SimplePage type for simple has-more pagination.
 *
 * @param classRef - The entity class (must have `@ObjectType()` applied).
 * @returns An abstract ObjectType with `items`, `page`, `limit`, `hasMore`.
 */
export function createSimplePageType<T>(classRef: IType<T>): IType<any> {
  @ObjectType({ isAbstract: true })
  abstract class SimplePageType {
    @Field(() => [classRef]) public items!: T[];
    @Field(() => Int) public page!: number;
    @Field(() => Int) public limit!: number;
    @Field(() => Boolean) public hasMore!: boolean;
  }
  return SimplePageType as IType<any>;
}

/**
 * Create a GraphQL Connection type for Relay-style cursor pagination.
 *
 * @param classRef - The entity class (must have `@ObjectType()` applied).
 * @param entityName - PascalCase entity name for type naming.
 * @returns An abstract ObjectType with `edges`, `pageInfo`, `totalCount`.
 */
export function createConnectionType<T>(classRef: IType<T>, entityName: string): IType<any> {
  @ObjectType(`${entityName}Edge`, { isAbstract: true })
  abstract class EdgeType {
    @Field(() => classRef) public node!: T;
    @Field(() => String) public cursor!: string;
  }

  @ObjectType({ isAbstract: true })
  abstract class ConnectionType {
    @Field(() => [EdgeType]) public edges!: any[];
    @Field(() => PageInfo) public pageInfo!: PageInfo;
    @Field(() => Int) public totalCount!: number;
  }

  return ConnectionType as IType<any>;
}
