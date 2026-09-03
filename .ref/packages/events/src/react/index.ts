/**
 * @file index.ts
 * @module @stackra/events/react
 * @description Public API for the events React subpath.
 *   Import via `@stackra/events/react`.
 */

// ── DI wiring ─────────────────────────────────────────────────────
export { WebEventEmitterModule } from "./web-events.module";
export type { IWebEventsModuleAsyncOptions } from "./web-events.module";

// ── React hooks (cross-platform, live in ../core) ─────────────────
export { useEventEmitter, useOnEvent } from "../core";
