/**
 * @file index.ts
 * @module @stackra/events/native
 * @description React Native subpath — re-exports the cross-platform
 *   React hooks (`useEventEmitter`, `useOnEvent`) from
 *   `@stackra/events/core`. The event emitter itself is
 *   cross-platform (pure JS + workspace DI); native does not ship
 *   a distinct DI module.
 */
export { useEventEmitter, useOnEvent } from "../core";
