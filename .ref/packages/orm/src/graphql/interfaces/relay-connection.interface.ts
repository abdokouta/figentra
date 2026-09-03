/**
 * @file relay-connection.type.ts
 * @module @stackra/nestjs-orm/graphql/types
 * @description Relay-compatible connection types for cursor-based pagination.
 *   Used by auto-generated GraphQL resolvers.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Relay-compatible connection result.
 */
export interface RelayConnection<T> {
  /** Array of edges (node + cursor pairs). */
  edges: Array<{ node: T; cursor: string }>;
  /** Page info for cursor navigation. */
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  /** Total number of records matching the filter. */
  totalCount: number;
}

/**
 * Relay pagination arguments.
 */
export interface RelayArgs {
  /** Number of items to fetch (forward pagination). */
  first?: number;
  /** Cursor to start after (forward pagination). */
  after?: string;
  /** Number of items to fetch (backward pagination). */
  last?: number;
  /** Cursor to start before (backward pagination). */
  before?: string;
}
