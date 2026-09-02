/**
 * @file sync.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the offline-first sync subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (sdui, ai, custom
 *   modules) can inject the sync engine and its collaborators without
 *   pulling in the `@stackra/sync` runtime.
 *
 *   NOTE: `NETWORK_DETECTOR` is owned by the network subsystem and lives in
 *   `network.tokens.ts` — sync consumes it but does not own it.
 */

/**
 * Configuration namespace for the sync subsystem (top-level).
 *
 * String constant used both as the `registerAs(SYNC_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `SyncModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"sync"` and reach the same registration.
 *
 * Distinct from the sub-scope tokens
 * ({@link CONFLICT_RESOLVER_CONFIG}, {@link NETWORK_DETECTOR_CONFIG},
 * {@link OPERATION_QUEUE_CONFIG}) which target individual slices.
 */
export const SYNC_CONFIG = "sync" as const;

/** Token for the top-level sync orchestrator (`SyncEngine`). */
export const SYNC_ENGINE = Symbol.for("SYNC_ENGINE");

/** Token for the cursor-based pull service. */
export const PULL_SERVICE = Symbol.for("PULL_SERVICE");

/** Token for the batched push service. */
export const PUSH_SERVICE = Symbol.for("PUSH_SERVICE");

/** Token for the merge service that lands pulled data into the local store. */
export const MERGE_SERVICE = Symbol.for("MERGE_SERVICE");

/** Token for the offline operation queue. */
export const OPERATION_QUEUE = Symbol.for("OPERATION_QUEUE");

/** Token for the pluggable conflict resolver. */
export const CONFLICT_RESOLVER = Symbol.for("CONFLICT_RESOLVER");

/** Token for the consumer-supplied local storage adapter ({@link ILocalStorageAdapter}). */
export const LOCAL_STORAGE_ADAPTER = Symbol.for("LOCAL_STORAGE_ADAPTER");

/** Token for the checkpoint persistence service. */
export const CHECKPOINT_SERVICE = Symbol.for("CHECKPOINT_SERVICE");

/** Token for the conflict-resolver configuration slice. */
export const CONFLICT_RESOLVER_CONFIG = "sync.conflict-resolver" as const;

/** Token for the network-detector configuration slice. */
export const NETWORK_DETECTOR_CONFIG = "sync.network-detector" as const;

/** Token for the operation-queue configuration slice. */
export const OPERATION_QUEUE_CONFIG = "sync.operation-queue" as const;
