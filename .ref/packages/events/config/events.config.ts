/**
 * @file events.config.ts
 * @module @stackra/events/config
 * @description Application-level event emitter configuration.
 *   Consumed by `EventEmitterModule.forRoot()` at bootstrap.
 */

import { IdefineConfig } from '@stackra/events';

export default IdefineConfig({
  /*
  |--------------------------------------------------------------------------
  | Global Registration
  |--------------------------------------------------------------------------
  |
  | When true, the events module is registered globally so that all modules
  | in the application can inject the EventEmitter without re-importing
  | the EventEmitterModule.
  |
  */
  global: true,

  /*
  |--------------------------------------------------------------------------
  | Wildcard Matching
  |--------------------------------------------------------------------------
  |
  | When set to true, listeners can use wildcard patterns to subscribe to
  | groups of events. Single segment (*) matches one part, double segment
  | (**) matches one or more parts separated by the delimiter.
  |
  */
  wildcard: true,

  /*
  |--------------------------------------------------------------------------
  | Event Delimiter
  |--------------------------------------------------------------------------
  |
  | This character is used to split event names into segments for wildcard
  | pattern matching. The standard is a dot (.) which produces segments
  | like: user.created, order.payment.failed, etc.
  |
  */
  delimiter: '.',

  /*
  |--------------------------------------------------------------------------
  | Maximum Listeners
  |--------------------------------------------------------------------------
  |
  | This value determines the maximum number of listeners that may be
  | registered for a single event before a memory leak warning is emitted.
  | Set to 0 to disable the warning entirely.
  |
  */
  maxListeners: 20,

  /*
  |--------------------------------------------------------------------------
  | Suppress Errors
  |--------------------------------------------------------------------------
  |
  | When true, errors thrown by listeners are caught and logged but do not
  | propagate to the emitter caller. This prevents a single failing listener
  | from breaking the entire event chain. Individual listeners can override.
  |
  */
  suppressErrors: true,

  /*
  |--------------------------------------------------------------------------
  | Default Queue Name
  |--------------------------------------------------------------------------
  |
  | The queue name used when a listener has `queued: true` but no explicit
  | queue name specified. Requires @stackra/queue as a peer dependency.
  |
  */
  defaultQueue: 'events',
});
