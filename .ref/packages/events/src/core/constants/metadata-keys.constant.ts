/**
 * @file metadata-keys.constant.ts
 * @module @stackra/events/core/constants
 * @description Metadata keys for event decorators and DI tokens.
 *   Used by `@OnEvent` and `@EventTransport` decorators to store metadata
 *   that the `EventSubscribersLoader` reads at bootstrap.
 */

import { EVENT_EMITTER } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Decorator Metadata Keys
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Metadata key for `@OnEvent()` decorator.
 *
 * Stored on the decorated METHOD via `@vivtel/metadata`. Value is an array
 * of `IOnEventMetadata` entries (stacking is supported — multiple `@OnEvent`
 * decorators on the same method).
 */
export const EVENT_LISTENER_METADATA = 'stackra:events:listener';

/**
 * Metadata key for `@EventTransport()` decorator.
 *
 * Stored on the decorated CLASS via `@vivtel/metadata`. Value is the
 * transport options object (`IEventTransportOptions`).
 */
export const EVENT_TRANSPORT_METADATA = 'stackra:events:transport';

// ════════════════════════════════════════════════════════════════════════════════
// DI Tokens
// ════════════════════════════════════════════════════════════════════════════════

/**
 * DI token for the `EventEmitter` service instance.
 *
 * Inject via `@Inject(EVENT_EMITTER_TOKEN)` or use the convenience
 * `@InjectEventEmitter()` parameter decorator.
 *
 * @deprecated Use `EVENT_EMITTER` from `@stackra/contracts` directly.
 */
export const EVENT_EMITTER_TOKEN = EVENT_EMITTER;

/**
 * DI token for the event emitter configuration object.
 *
 * Internal to the events module — consumers inject the `EventEmitter`
 * directly, not the config.
 */
export const EVENT_EMITTER_CONFIG_TOKEN = Symbol.for('EVENT_EMITTER_CONFIG');
