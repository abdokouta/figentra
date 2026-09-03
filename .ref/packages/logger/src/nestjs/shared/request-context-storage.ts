/**
 * @file request-context-storage.ts
 * @module @stackra/logger/nestjs/shared
 * @description Shared AsyncLocalStorage instance for per-request context.
 *   Extracted to break the circular dependency between middleware ↔ service.
 */

import { AsyncLocalStorage } from 'async_hooks';

/**
 * Shared AsyncLocalStorage instance for request context.
 * Used by both the middleware (writes) and services (reads).
 */
export const requestContextStorage = new AsyncLocalStorage<IRequestContext>();

/**
 * Get the current request context from AsyncLocalStorage.
 *
 * @returns Current request context or undefined (if called outside a request)
 */
export function getRequestContext(): IRequestContext | undefined {
  return requestContextStorage.getStore();
}
