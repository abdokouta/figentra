/**
 * @file config-event-emitter.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IConfigEventEmitter interface.
 */

/**
 * Minimal event emitter interface for config events.
 */
export interface IConfigEventEmitter {
  /**
   * Emit an event with data.
   *
   * @param event - Event name
   * @param data - Event payload
   */
  emit(event: string, data: unknown): void;
}
