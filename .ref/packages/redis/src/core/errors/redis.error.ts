/**
 * @file redis.error.ts
 * @module @stackra/ts-redis/errors
 * @description Base error class for all Redis-specific errors.
 *   Every Redis error carries the connection name and optional command
 *   name for diagnostic purposes.
 */

/**
 * Base Redis error.
 *
 * All Redis-specific errors extend this class, enabling consumers to
 * catch `RedisError` for broad handling or specific subclasses for
 * targeted recovery.
 */
export class RedisError extends Error {
  /** The connection name where the error occurred. */
  public readonly connection: string;

  /** The Redis command that failed (if applicable). */
  public readonly command?: string;

  /**
   * @param message - Human-readable error description.
   * @param connection - The connection name.
   * @param command - The command that triggered the error.
   * @param cause - The original upstream error.
   */
  public constructor(message: string, connection: string, command?: string, cause?: Error) {
    super(message, { cause });
    this.name = 'RedisError';
    this.connection = connection;
    this.command = command;
  }
}
