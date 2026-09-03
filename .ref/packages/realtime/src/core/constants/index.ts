/**
 * @file index.ts
 * @module @stackra/realtime/core/constants
 * @description DI tokens and event constants for the realtime system.
 */

/** DI token for the RealtimeManager. */
export const REALTIME_MANAGER = Symbol.for('REALTIME_MANAGER');

/** DI token for the realtime module configuration. */
export const REALTIME_CONFIG = Symbol.for('REALTIME_CONFIG');

/** Realtime lifecycle events emitted via EventEmitter. */
export const REALTIME_EVENTS = {
  CONNECTED: 'realtime.connected',
  DISCONNECTED: 'realtime.disconnected',
  RECONNECTING: 'realtime.reconnecting',
  ERROR: 'realtime.error',
  MESSAGE: 'realtime.message',
} as const;
