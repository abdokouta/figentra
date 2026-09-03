/**
 * @file script-registry.service.ts
 * @module @stackra/ts-redis/scripts
 * @description Lua script registry with EVALSHA optimization. Registers
 *   named scripts at boot, attempts EVALSHA first, falls back to EVAL
 *   on NOSCRIPT error, and caches the SHA for subsequent calls.
 */

import { IInjectable, Inject } from '@stackra/ts-container';
import { Logger } from '@stackra/logger';
import { createHash } from 'crypto';

import type { IRedisScriptRegistry, IRedisManager } from '@stackra/contracts';
import { REDIS_MANAGER } from '@stackra/contracts';

import { RedisScriptError } from '../errors';

/**
 * Internal script entry stored in the registry.
 */
interface IScriptEntry {
  /** The Lua source code. */
  source: string;
  /** The SHA1 hash of the source. */
  sha: string;
}

/**
 * Lua script registry.
 *
 * Manages named Lua scripts with SHA-based caching for EVALSHA
 * optimization. On NOSCRIPT error, falls back to EVAL and re-caches.
 */
@IInjectable()
export class ScriptRegistry implements IRedisScriptRegistry {
  /** Scoped logger. */
  private readonly logger = new Logger(ScriptRegistry.name);

  /** Map of script name to entry. */
  private readonly scripts: Map<string, IScriptEntry> = new Map();

  /**
   * @param manager - Redis manager for executing scripts.
   */
  public constructor(@Inject(REDIS_MANAGER) private readonly manager: IRedisManager) {}

  /**
   * Register a named Lua script.
   *
   * @param name - Unique script identifier.
   * @param source - The Lua source code.
   */
  public register(name: string, source: string): void {
    const sha = createHash('sha1').update(source).digest('hex');
    this.scripts.set(name, { source, sha });
    this.logger.info(`[ScriptRegistry] Registered script "${name}" (SHA: ${sha.slice(0, 8)}...)`);
  }

  /**
   * Execute a registered script by name.
   *
   * Attempts EVALSHA first. On NOSCRIPT error, falls back to EVAL.
   *
   * @param name - The script identifier.
   * @param keys - Keys the script will access (KEYS array).
   * @param args - Additional arguments (ARGV array).
   * @param connectionName - Optional connection to execute on.
   * @returns The script's return value.
   * @throws {RedisScriptError} When the script is not registered or execution fails.
   */
  public async execute(
    name: string,
    keys: string[],
    args: (string | number)[],
    connectionName?: string
  ): Promise<unknown> {
    const entry = this.scripts.get(name);
    if (!entry) {
      throw new RedisScriptError(
        `Script "${name}" is not registered.`,
        connectionName ?? 'default',
        name
      );
    }

    const client = await this.manager.connection(connectionName);

    try {
      return await client.evalsha(entry.sha, keys, args);
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message ?? '';

      // NOSCRIPT error — fall back to EVAL
      if (errorMessage.includes('NOSCRIPT')) {
        this.logger.warn(`[ScriptRegistry] NOSCRIPT for "${name}", falling back to EVAL.`);
        try {
          return await client.eval(entry.source, keys, args);
        } catch (evalError: unknown) {
          throw new RedisScriptError(
            `Script "${name}" failed: ${(evalError as Error).message}`,
            connectionName ?? client.getName(),
            name,
            evalError as Error
          );
        }
      }

      throw new RedisScriptError(
        `Script "${name}" failed: ${errorMessage}`,
        connectionName ?? client.getName(),
        name,
        error as Error
      );
    }
  }

  /**
   * Clear all cached SHAs (for use after Redis server restart).
   */
  public flush(): void {
    // SHAs are derived from source, so we just log the flush.
    // The next EVALSHA call will get NOSCRIPT and fall back to EVAL.
    this.logger.info('[ScriptRegistry] Flushed all cached SHAs.');
  }

  /**
   * Check if a script is registered.
   *
   * @param name - The script identifier.
   * @returns `true` if registered.
   */
  public has(name: string): boolean {
    return this.scripts.has(name);
  }
}
