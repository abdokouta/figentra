/**
 * @file index.ts
 * @module @stackra/cache/react
 * @description Public API for the cache React subpath.
 *   Provides React hooks for accessing cache services from DI.
 *   Import via `@stackra/cache/react`.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Hooks
// ════════════════════════════════════════════════════════════════════════════════
export { useCache } from './hooks';
export { useCacheManager } from './hooks';
export { useCacheValue, type IUseCacheValueResult } from './hooks';
