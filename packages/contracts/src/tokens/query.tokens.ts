/**
 * @file query.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/query` layer.
 *
 *   The realtime transport is provided by `@stackra/realtime` — inject
 *   `REALTIME_MANAGER` directly for `liveMode` subscriptions and
 *   `channel.whisper(...)` broadcasts. No separate `LIVE_PROVIDER`
 *   abstraction is needed.
 *
 */

/**
 * Configuration namespace for the query subsystem.
 *
 * String constant used both as the `registerAs(QUERY_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `QueryModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"query"` and reach the same registration.
 */
export const QUERY_CONFIG = "query" as const;

/** Token for the {@link IQueryClient} — owns fetcher registration + invalidation. */
export const QUERY_CLIENT = Symbol.for("QUERY_CLIENT");

/**
 * Token for the {@link IUndoableQueue} — the queue that tracks
 * in-flight `mutationMode: 'undoable'` mutations.
 *
 * @remarks Bound by `QueryModule.forRoot`. Toast UI packages
 *   subscribe to it to render the undo affordance.
 */
export const UNDOABLE_QUEUE = Symbol.for("UNDOABLE_QUEUE");
