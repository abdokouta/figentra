/**
 * @file async-context-repository.service.ts
 * @module @stackra/logger/nestjs/services
 * @description Request-scoped context repository backed by AsyncLocalStorage.
 *   Extends the base ContextRepository to provide per-request isolation in
 *   NestJS backends. Each HTTP request gets its own isolated context store,
 *   preventing race conditions between concurrent requests.
 *
 *   Global context (set outside a request) is stored in the base class's Map
 *   and merged with request-scoped context when `all()` is called.
 *
 *   Request context (traceId, requestId, correlationId, spanId) is automatically
 *   injected from the RequestContextMiddleware's AsyncLocalStorage.
 */

import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import type { LogContext } from '@stackra/contracts';

import { ContextRepository } from '../../core/services/context-repository.service';
import { getRequestContext } from '../shared/request-context-storage';

/**
 * Shape of the per-request context store held in AsyncLocalStorage.
 */
export interface IAsyncContextStore {
  /** Request-scoped visible context data. */
  data: Map<string, unknown>;

  /** Request-scoped hidden context data. */
  hidden: Map<string, unknown>;
}

/**
 * AsyncLocalStorage instance for per-request context isolation.
 * Shared across all instances of AsyncContextRepository (they're singletons).
 */
export const contextStorage = new AsyncLocalStorage<IAsyncContextStore>();

/**
 * Request-scoped context repository — per-request isolation via AsyncLocalStorage.
 *
 * Extends the base `ContextRepository` and overrides the store access methods
 * to use a per-request store when running inside an AsyncLocalStorage context
 * (i.e., inside a NestJS request). Falls back to the base class's singleton
 * Map when called outside a request (e.g., during app bootstrap, in queues).
 *
 * This eliminates race conditions: request A writing `userId: 'abc'` will
 * never bleed into request B's logs.
 *
 * The `all()` method merges three layers:
 * 1. Global context (base class Map — shared across all requests)
 * 2. Request propagation context (requestId, traceId, correlationId from middleware)
 * 3. Request-scoped context (per-request additions via `add()`)
 *
 * Priority (highest wins): request-scoped > request propagation > global
 *
 * @example
 * ```typescript
 * // During bootstrap (no request) — writes to global context
 * repo.add('service', 'api');
 * repo.add('version', '2.1.0');
 *
 * // During a request — writes to that request's isolated store
 * repo.add('userId', 'user-123');  // Only visible in THIS request's logs
 *
 * // all() returns merged: { service: 'api', version: '2.1.0', userId: 'user-123',
 * //   requestId: 'req-...', traceId: '...', correlationId: '...' }
 * ```
 */
@Injectable()
export class AsyncContextRepository extends ContextRepository {
  // ══════════════════════════════════════════════════════════════════════════
  // AsyncLocalStorage Management
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Run a callback within a new isolated request context.
   * Used by the RequestContextMiddleware to set up per-request isolation.
   *
   * @param callback - Function to execute within the isolated context
   * @returns The return value of the callback
   */
  public runInContext<T>(callback: () => T): T {
    const store: IAsyncContextStore = {
      data: new Map(),
      hidden: new Map(),
    };

    return contextStorage.run(store, callback);
  }

  /**
   * Run an async callback within a new isolated request context.
   * Variant of `runInContext` for async middleware.
   *
   * @param callback - Async function to execute within the isolated context
   * @returns Promise resolving to the callback's return value
   */
  public runInContextAsync<T>(callback: () => Promise<T>): Promise<T> {
    const store: IAsyncContextStore = {
      data: new Map(),
      hidden: new Map(),
    };

    return contextStorage.run(store, callback);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Override: all() — merges global + request propagation + request-scoped
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get all visible context as a merged object.
   *
   * Merges three layers (lowest to highest priority):
   * 1. Global context (base class Map)
   * 2. Request propagation context (requestId, traceId, correlationId, spanId)
   * 3. Request-scoped context (from AsyncLocalStorage store)
   *
   * @returns Merged context snapshot
   */
  public override all(): LogContext {
    const result: LogContext = {};

    // 1. Global context (base class) — lowest priority
    for (const [key, value] of this.data) {
      result[key] = value;
    }

    // 2. Request propagation context from middleware
    const reqCtx = getRequestContext();
    if (reqCtx) {
      result.requestId = reqCtx.requestId;
      result.traceId = reqCtx.traceId;
      result.correlationId = reqCtx.correlationId;
      if (reqCtx.spanId) {
        result.spanId = reqCtx.spanId;
      }
      if (reqCtx.parentSpanId) {
        result.parentSpanId = reqCtx.parentSpanId;
      }
    }

    // 3. Request-scoped context — highest priority
    const store = this.getRequestStore();
    if (store) {
      for (const [key, value] of store.data) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get all hidden context as a merged object (global + request-scoped).
   *
   * @returns Merged hidden context snapshot
   */
  public override allHidden(): LogContext {
    const result: LogContext = {};

    // Global hidden
    for (const [key, value] of this.hiddenData) {
      result[key] = value;
    }

    // Request-scoped hidden
    const store = this.getRequestStore();
    if (store) {
      for (const [key, value] of store.hidden) {
        result[key] = value;
      }
    }

    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Override: Store Access — route to ALS or fallback to global
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the active data store for the current context.
   * Returns the request-scoped store if inside a request, otherwise the global store.
   *
   * @returns The Map to use for visible context operations
   */
  protected override getDataStore(): Map<string, unknown> {
    const store = this.getRequestStore();
    return store ? store.data : this.data;
  }

  /**
   * Get the active hidden data store for the current context.
   * Returns the request-scoped store if inside a request, otherwise the global store.
   *
   * @returns The Map to use for hidden context operations
   */
  protected override getHiddenStore(): Map<string, unknown> {
    const store = this.getRequestStore();
    return store ? store.hidden : this.hiddenData;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private — AsyncLocalStorage helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the current request's context store from AsyncLocalStorage.
   * Returns undefined if called outside a request scope.
   *
   * @returns The request-scoped store, or undefined
   */
  private getRequestStore(): IAsyncContextStore | undefined {
    return contextStorage.getStore();
  }
}
