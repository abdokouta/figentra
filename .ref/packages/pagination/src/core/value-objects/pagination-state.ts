/**
 * @file pagination-state.ts
 * @module @stackra/ts-pagination/core/value-objects
 * @description AsyncLocalStorage-based pagination context resolution.
 *   Stores the current request's pagination parameters (page, perPage, cursor)
 *   in a request-scoped async context for access anywhere in the call stack.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { Cursor } from './cursor';

// ════════════════════════════════════════════════════════════════════════════════
// Context Interface
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Storage Instance
// ════════════════════════════════════════════════════════════════════════════════

/**
 * AsyncLocalStorage instance for pagination context.
 *
 * The middleware sets this at the beginning of each request, making
 * pagination parameters available anywhere in the call stack without
 * explicit parameter passing.
 */
export const paginationStorage = new AsyncLocalStorage<IPaginationContext>();

// ════════════════════════════════════════════════════════════════════════════════
// Accessor Functions
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Retrieve the full pagination context for the current request.
 *
 * @returns The pagination context, or undefined if no context is active
 */
export function getCurrentPagination(): IPaginationContext | undefined {
  return paginationStorage.getStore();
}

/**
 * Retrieve the current page number from the async context.
 *
 * @param defaultPage - Fallback page number when no context exists
 * @returns The current page number
 */
export function getCurrentPage(defaultPage: number = 1): number {
  return paginationStorage.getStore()?.page ?? defaultPage;
}

/**
 * Retrieve the current per-page count from the async context.
 *
 * @param defaultPerPage - Fallback per-page count when no context exists
 * @returns The current per-page count
 */
export function getCurrentPerPage(defaultPerPage: number = 15): number {
  return paginationStorage.getStore()?.perPage ?? defaultPerPage;
}

/**
 * Retrieve the current cursor from the async context.
 *
 * @returns The current cursor, or null if not in cursor-based pagination
 */
export function getCurrentCursor(): Cursor | null {
  return paginationStorage.getStore()?.cursor ?? null;
}
