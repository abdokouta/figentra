/**
 * @file sdui.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by the SDUI runtime on the shared
 *   event bus.
 */

/**
 * SDUI runtime lifecycle events.
 */
export const SDUI_EVENTS = {
  /**
   * The composite `ComponentRegistry` finished discovery-driven
   * hydration. Fired once at `onApplicationBootstrap` by the
   * `ComponentSourceHydrator` after every `@SduiComponentSource(...)`
   * class has merged its entries into the composite (sorted by
   * `priority` ascending, later wins).
   *
   * Payload shape lives in `@stackra/sdui/core/loaders` as
   * `ISduiCatalogueHydratedPayload` — kept out of contracts to
   * avoid a hard runtime dep back into `@stackra/sdui`.
   */
  CATALOGUE_HYDRATED: "sdui.catalogue.hydrated",
  /** A screen was resolved (cache-miss fetch). */
  SCREEN_RESOLVED: "sdui.screen.resolved",
  /** A cached screen was invalidated. */
  SCREEN_INVALIDATED: "sdui.screen.invalidated",
  /** An action was dispatched from a rendered node. */
  ACTION_DISPATCHED: "sdui.action.dispatched",
  /** A node completed a render pass. */
  NODE_RENDERED: "sdui.node.rendered",
  /** A node caught an error via its error boundary. */
  NODE_ERRORED: "sdui.node.errored",
  /** A screen's data source finished loading. */
  DATA_SOURCE_LOADED: "sdui.datasource.loaded",
  /** A screen's data source failed to load. */
  DATA_SOURCE_FAILED: "sdui.datasource.failed",
  /** A server-driven theme scope mounted. */
  THEME_APPLIED: "sdui.theme.applied",
} as const;

/** Union type of every emitted SDUI event name. */
export type SduiEventName = (typeof SDUI_EVENTS)[keyof typeof SDUI_EVENTS];
