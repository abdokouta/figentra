/**
 * @file sdui-data-source-resolver.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Contract for the SDUI data-source resolver — turns a
 *   schema binding like `{ "$data": "queries.athletes" }` into a live
 *   value from the app's query cache.
 *
 *   Schemas ship binding strings; the resolver's job is a
 *   platform-agnostic lookup against whatever the app has registered
 *   under those keys. The concrete implementation in `@stackra/sdui`
 *   composes `@stackra/query`'s TanStack Query cache — a schema
 *   binding `"queries.athletes"` resolves to
 *   `queryClient.getData(["queries", "athletes"])`.
 *
 *   Consumers reach the resolver through the {@link SDUI_DATA_SOURCE_RESOLVER}
 *   token; every field name / union member here is authored so the
 *   token's `useOptionalInject` result type-narrows cleanly.
 */

/**
 * SDUI data-source resolver.
 *
 * Resolves a schema binding string into a live value. The binding
 * shape is a dotted path (`"queries.athletes"`, `"state.cart.items"`,
 * `"session.user.name"`); the resolver splits on `.` and looks up the
 * segments against its underlying source (query cache, state store,
 * session bag, whatever the concrete implementation composes).
 *
 * @example Read a query result
 * ```typescript
 * const resolver = useOptionalInject<ISduiDataSourceResolver>(
 *   SDUI_DATA_SOURCE_RESOLVER,
 * );
 * const athletes = resolver?.resolve("queries.athletes");
 * ```
 */
export interface ISduiDataSourceResolver {
  /**
   * Resolve a dotted-path binding to a live value.
   *
   * @param binding - Dotted-path binding, e.g. `"queries.athletes"`.
   * @returns The resolved value, or `undefined` when the binding
   *   doesn't map to any cached / registered source.
   */
  resolve(binding: string): unknown;

  /**
   * List every binding path the resolver currently knows about.
   * Optional — implementations that can't enumerate their sources
   * (e.g. lazy query caches) return `undefined`.
   */
  list?(): readonly string[];
}
