/**
 * @file redis-script.error.ts
 * @module @stackra/ts-redis/errors
 * @description Thrown when a Lua script execution fails on the Redis server.
 */

import { RedisError } from './redis.error';

/**
 * Redis script error.
 *
 * Thrown when a Lua script registered with the ScriptRegistry fails
 * during execution (runtime error in the Lua code).
 */
export class RedisScriptError extends RedisError {
  /** The script name that failed. */
  public readonly scriptName: string;

  /**
   * @param message - Human-readable error description.
   * @param connection - The connection name.
   * @param scriptName - The registered script name.
   * @param cause - The original upstream error.
   */
  public constructor(message: string, connection: string, scriptName: string, cause?: Error) {
    super(message, connection, 'EVAL', cause);
    this.name = 'RedisScriptError';
    this.scriptName = scriptName;
  }
}
