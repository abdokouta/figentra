/**
 * @file events.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the event system.
 */

/** Token for the EventEmitter instance. */
export const EVENT_EMITTER = Symbol.for("EVENT_EMITTER");

/**
 * Configuration namespace for the events subsystem.
 *
 * String constant used both as the `registerAs(EVENTS_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `EventEmitterModule` binds the resolved config under. The value IS
 * the namespace string — consumers can spell either the constant or
 * the literal `"events"` and reach the same registration.
 */
export const EVENTS_CONFIG = "events" as const;

/**
 * Metadata key stamped by the `@OnEvent(...)` method decorator on
 * a class's prototype for each decorated method. The listener
 * loader reads it via `getMetadata(EVENT_LISTENER_METADATA_KEY,
 * prototype, methodName)`.
 *
 * Multiple `@OnEvent(...)` applications on the same method
 * accumulate via `updateMetadata` — the payload is an array of
 * `IOnEventMetadata` entries.
 */
export const EVENT_LISTENER_METADATA_KEY = "stackra:events:listener";

/**
 * Metadata key stamped by the `@EventTransport(options)` class
 * decorator. `EventSubscribersLoader` reads it via
 * `discovery.getProvidersByMetadata(EVENT_TRANSPORT_METADATA_KEY)`
 * at bootstrap.
 */
export const EVENT_TRANSPORT_METADATA_KEY = "stackra:events:transport";

/**
 * Metadata key stamped by the `@EventSubscriber(map)` class
 * decorator. The payload is the event-to-method map.
 */
export const EVENT_SUBSCRIBER_METADATA_KEY = "stackra:events:subscriber";
