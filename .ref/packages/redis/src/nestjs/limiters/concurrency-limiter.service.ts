/**
 * @file concurrency-limiter.service.ts
 * @module @stackra/nestjs-redis/limiters
 * @description Concurrency limiter (funnel pattern). Restricts the number
 *   of simultaneous executions using Lua-based slot acquisition with TTL guards.
 *   Mirrors Laravel's ConcurrencyLimiter with cluster-safe hash-tag prefixing.
 */

import { IInjectable, Inject } from '@nestjs/common';
import { Str } from '@stackra/ts-support';

import type { IRedisManager } from '@stackra/contracts';
import { REDIS_MANAGER } from '@stackra/contracts';
import {
  LimiterTimeoutError,
  CONCURRENCY_ACQUIRE_SCRIPT,
  CONCURRENCY_RELEASE_SCRIPT,
} from '../../core/index';
import {
  DEFAULT_SLOT_RELEASE_AFTER,
  DEFAULT_LIMITER_BLOCK_TIMEOUT,
  DEFAULT_LIMITER_SLEEP_MS,
} from '../../core/constants';

/**
 * Concurrency limiter service (funnel pattern).
 *
 * Restricts the number of simultaneous executions of a named resource.
 * Uses Lua scripts for atomic slot acquisition and release with TTL
 * guards to prevent deadlocks from crashed processes.
 */
@IInjectable()
export class ConcurrencyLimiterService {
  /**
   * @param manager - Redis manager for client access.
   */
  public constructor(@Inject(REDIS_MANAGER) private readonly manager: IRedisManager) {}

  /**
   * Acquire a concurrency slot.
   *
   * @param name - The limiter name (resource identifier).
   * @param maxSlots - Maximum concurrent slots allowed.
   * @param releaseAfterSeconds - TTL for the slot (auto-release on crash).
   * @returns The slot key if acquired, `null` if all slots occupied.
   */
  public async acquire(
    name: string,
    maxSlots: number,
    releaseAfterSeconds: number
  ): Promise<string | null> {
    const client = await this.manager.connection();
    const prefix = this.getPrefix(name);
    const id = Str.random(20);

    const keys = Array.from({ length: maxSlots }, (_, i) => `${prefix}${i + 1}`);
    const result = await client.eval(CONCURRENCY_ACQUIRE_SCRIPT, keys, [
      prefix,
      releaseAfterSeconds,
      id,
    ]);

    return result ? String(result) : null;
  }

  /**
   * Release a previously acquired slot.
   *
   * @param slotKey - The slot key returned by `acquire()`.
   * @param id - The unique identifier for this holder.
   * @returns `true` if released, `false` if ID mismatch.
   */
  public async release(slotKey: string, id: string): Promise<boolean> {
    const client = await this.manager.connection();
    const result = await client.eval(CONCURRENCY_RELEASE_SCRIPT, [slotKey], [id]);
    return result === 1;
  }

  /**
   * Execute a callback within the concurrency limit.
   *
   * Acquires a slot, executes the callback, and releases the slot
   * regardless of success or failure.
   *
   * @param name - The limiter name.
   * @param maxSlots - Maximum concurrent slots.
   * @param releaseAfter - Slot TTL in seconds.
   * @param timeout - Maximum wait time in seconds.
   * @param callback - The protected operation.
   * @param sleepMs - Sleep between retries in milliseconds.
   * @returns The callback's return value.
   * @throws {LimiterTimeoutError} If slot cannot be acquired within timeout.
   */
  public async block<T>(
    name: string,
    maxSlots: number,
    releaseAfter: number = DEFAULT_SLOT_RELEASE_AFTER,
    timeout: number = DEFAULT_LIMITER_BLOCK_TIMEOUT,
    callback: () => Promise<T> | T,
    sleepMs: number = DEFAULT_LIMITER_SLEEP_MS
  ): Promise<T> {
    const startTime = Date.now();
    const id = Str.random(20);
    const client = await this.manager.connection();
    const prefix = this.getPrefix(name);
    const keys = Array.from({ length: maxSlots }, (_, i) => `${prefix}${i + 1}`);

    let slotKey: string | null = null;

    while (!slotKey) {
      const result = await client.eval(CONCURRENCY_ACQUIRE_SCRIPT, keys, [
        prefix,
        releaseAfter,
        id,
      ]);
      slotKey = result ? String(result) : null;

      if (!slotKey) {
        if ((Date.now() - startTime) / 1000 >= timeout) {
          throw new LimiterTimeoutError(name, client.getName());
        }
        await new Promise((resolve) => setTimeout(resolve, sleepMs));
      }
    }

    try {
      return await callback();
    } finally {
      await client.eval(CONCURRENCY_RELEASE_SCRIPT, [slotKey], [id]);
    }
  }

  /**
   * Get the cluster-safe key prefix for lock slots.
   *
   * @param name - The limiter name.
   * @returns The prefix with hash tags for cluster routing.
   */
  private getPrefix(name: string): string {
    return `{${name}}:slot:`;
  }
}
