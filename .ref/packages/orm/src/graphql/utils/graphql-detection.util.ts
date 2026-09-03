/**
 * @file graphql-detection.util.ts
 * @module @stackra/nestjs-orm/graphql/utils
 * @description Runtime detection of `@nestjs/graphql` availability.
 *
 *   Used by decorators (`@Property`, `@Entity`, traits) to conditionally
 *   apply GraphQL metadata (`@Field`, `@ObjectType`) only when the GraphQL
 *   package is installed. This allows the ORM to be used in REST-only or
 *   non-GraphQL applications without crashing on missing imports.
 *
 *   ## How It Works
 *
 *   On first call, attempts `require.resolve('@nestjs/graphql')`. The result
 *   is cached — subsequent calls return immediately without filesystem access.
 */

// ============================================================================
// Detection
// ============================================================================

/** Cached detection result. `null` = not yet checked. */
let _graphqlAvailable: boolean | null = null;

/**
 * Check if `@nestjs/graphql` is available at runtime.
 *
 * Result is cached after the first check — safe to call in hot paths
 * (decorator execution, module initialization).
 *
 * @returns `true` if `@nestjs/graphql` can be resolved, `false` otherwise.
 */
export function isGraphQLAvailable(): boolean {
  if (_graphqlAvailable === null) {
    try {
      require.resolve('@nestjs/graphql');
      _graphqlAvailable = true;
    } catch {
      _graphqlAvailable = false;
    }
  }
  return _graphqlAvailable;
}

/**
 * Reset the cached detection result.
 *
 * **Only for testing.** Allows tests to simulate GraphQL being
 * available or unavailable by mocking `require.resolve`.
 */
export function resetGraphQLDetection(): void {
  _graphqlAvailable = null;
}
