/**
 * @file graphql-args.constant.ts
 * @description Constants for GraphQL argument names and default values.
 * Used by the CRUD resolver factory to avoid hard-coded strings.
 */

/** GraphQL argument names used across all auto-generated resolvers. */
export const GQL_ARG = {
  /** Filter argument name. */
  FILTER: 'filter',
  /** Sort argument name. */
  SORT: 'sort',
  /** Page number argument name (offset pagination). */
  PAGE: 'page',
  /** Items per page argument name. */
  LIMIT: 'limit',
  /** Cursor-based: number of items to fetch. */
  FIRST: 'first',
  /** Cursor-based: fetch items after this cursor. */
  AFTER: 'after',
  /** Entity ID argument name. */
  ID: 'id',
  /** Mutation input argument name. */
  INPUT: 'input',
} as const;

/** Default values for pagination arguments. */
export const GQL_DEFAULTS = {
  /** Default page number. */
  PAGE: 1,
  /** Default items per page. */
  LIMIT: 20,
  /** Maximum items per page (hard cap). */
  MAX_LIMIT: 100,
  /** Minimum items per page. */
  MIN_LIMIT: 1,
  /** Default cursor pagination first. */
  FIRST: 20,
} as const;
