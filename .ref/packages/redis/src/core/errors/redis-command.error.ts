/**
 * @file redis-command.error.ts
 * @module @stackra/ts-redis/errors
 * @description Thrown when a Redis command is rejected by the server
 *   (e.g., WRONGTYPE, syntax error, OOM).
 */

import { RedisError } from './redis.error';

/**
 * Redis command error.
 *
 * Thrown when the Redis server rejects a command. These are
 * deterministic failures — retrying the same command will produce
 * the same error.
 */
export class RedisCommandError extends RedisError {
  /** The command arguments that were sent. */
  public readonly args: (string | number)[];

  /**
   * @param message - Human-readable error description.
   * @param connection - The connection name.
   * @param command - The Redis command that failed.
   * @param args - The command arguments.
   * @param cause - The original upstream error.
   */
  public constructor(
    message: string,
    connection: string,
    command: string,
    args: (string | number)[],
    cause?: Error
  ) {
    super(message, connection, command, cause);
    this.name = 'RedisCommandError';
    this.args = args;
  }
}
