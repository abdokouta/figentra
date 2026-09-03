/**
 * @file command-failed-event.interface.ts
 * @module @stackra/redis/src/interfaces
 * @description ICommandFailedEvent interface.
 */

/**
 * Payload for the `REDIS_EVENTS.COMMAND_FAILED` event.
 *
 * Carries the command name, arguments, error details, connection
 * name, and timestamp for diagnostics and alerting.
 */
export interface ICommandFailedEvent {
  /** The Redis command name that failed. */
  command: string;

  /** The command arguments. */
  args: (string | number)[];

  /** The error that caused the failure. */
  error: Error;

  /** The connection name where the command failed. */
  connection: string;

  /** Unix timestamp (ms) when the command was issued. */
  timestamp: number;
}
