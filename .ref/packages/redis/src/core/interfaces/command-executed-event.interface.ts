/**
 * @file command-executed-event.interface.ts
 * @module @stackra/redis/src/interfaces
 * @description ICommandExecutedEvent interface.
 */

/**
 * Payload for the `REDIS_EVENTS.COMMAND_EXECUTED` event.
 *
 * Carries the command name, arguments, execution duration, connection
 * name, and timestamp for observability and slow-query detection.
 */
export interface ICommandExecutedEvent {
  /** The Redis command name (e.g., "GET", "HSET", "ZADD"). */
  command: string;

  /** The command arguments. */
  args: (string | number)[];

  /** Execution duration in milliseconds. */
  duration: number;

  /** The connection name where the command was executed. */
  connection: string;

  /** Unix timestamp (ms) when the command was issued. */
  timestamp: number;
}
