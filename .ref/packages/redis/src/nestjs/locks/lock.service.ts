/**
 * @file lock.service.ts
 * @module @stackra/nestjs-redis/locks
 * @description Distributed lock service using the Redlock algorithm.
 *   Provides fencing tokens, automatic TTL extension, and atomic
 *   compare-and-delete release via Lua scripts.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import { Logger } from '@stackra/logger';
import { Str } from '@stackra/ts-support';

import type {
  IEventEmitter,
  IRedisLock,
  IRedisManager,
  ILockOptions,
  ILockResult,
} from '@stackra/contracts';
import { REDIS_MANAGER, REDIS_EVENTS, EVENT_EMITTER } from '@stackra/contracts';
import { LockTimeoutError } from '../../core/errors';
import { LOCK_ACQUIRE_SCRIPT, LOCK_RELEASE_SCRIPT, LOCK_EXTEND_SCRIPT } from '../../core/scripts';
import {
  DEFAULT_LOCK_TTL,
  DEFAULT_LOCK_TIMEOUT,
  DEFAULT_LOCK_RETRY_DELAY,
} from '../../core/constants';

/**
 * Distributed lock service.
 *
 * Implements the Redlock algorithm with fencing tokens for safe
 * distributed mutual exclusion. Supports automatic TTL extension
 * to prevent premature expiration during long operations.
 */
@IInjectable()
export class LockService implements IRedisLock {
  /** Scoped logger. */
  private readonly logger = new Logger(LockService.name);

  /**
   * @param manager - Redis manager for client access.
   * @param eventEmitter - Optional event emitter for lock events.
   */
  public constructor(
    @Inject(REDIS_MANAGER) private readonly manager: IRedisManager,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter
  ) {}

  /**
   * Acquire a distributed lock on a resource.
   *
   * @param resource - The resource identifier to lock.
   * @param options - Lock configuration.
   * @returns The lock result with fencing token and release handle.
   * @throws {LockTimeoutError} When the lock cannot be acquired within timeout.
   */
  public async acquire(resource: string, options?: ILockOptions): Promise<ILockResult> {
    const ttl = options?.ttl ?? DEFAULT_LOCK_TTL;
    const timeout = options?.timeout ?? DEFAULT_LOCK_TIMEOUT;
    const retries = options?.retries ?? 3;
    const retryDelay = options?.retryDelay ?? DEFAULT_LOCK_RETRY_DELAY;
    const autoExtend = options?.autoExtend ?? true;

    const token = Str.random(32);
    const lockKey = `lock:${resource}`;
    const client = await this.manager.connection();
    const startTime = Date.now();

    for (let attempt = 0; attempt <= retries; attempt++) {
      const result = await client.eval(LOCK_ACQUIRE_SCRIPT, [lockKey], [token, String(ttl)]);

      if (result === 'OK') {
        const expiresAt = Date.now() + ttl;

        this.emit(REDIS_EVENTS.LOCK_ACQUIRED, { resource, token, ttl });

        let extendTimer: ReturnType<typeof setInterval> | null = null;

        if (autoExtend) {
          extendTimer = setInterval(
            async () => {
              try {
                await client.eval(LOCK_EXTEND_SCRIPT, [lockKey], [token, String(ttl)]);
              } catch {
                if (extendTimer) clearInterval(extendTimer);
              }
            },
            Math.floor(ttl / 3)
          );
        }

        const lockResult: ILockResult = {
          resource,
          token,
          expiresAt,
          extend: async () => {
            await client.eval(LOCK_EXTEND_SCRIPT, [lockKey], [token, String(ttl)]);
            lockResult.expiresAt = Date.now() + ttl;
            return lockResult;
          },
          release: async () => {
            if (extendTimer) clearInterval(extendTimer);
            await client.eval(LOCK_RELEASE_SCRIPT, [lockKey], [token]);
            this.emit(REDIS_EVENTS.LOCK_RELEASED, { resource, token });
          },
        };

        return lockResult;
      }

      if (Date.now() - startTime >= timeout) break;

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    this.logger.warn(`Lock acquisition timed out for resource "${resource}" after ${timeout}ms`);
    throw new LockTimeoutError(resource, client.getName());
  }

  /**
   * Release a lock by resource and fencing token.
   *
   * @param resource - The resource identifier.
   * @param token - The fencing token from acquisition.
   * @returns `true` if released, `false` if token mismatch.
   */
  public async release(resource: string, token: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    const client = await this.manager.connection();
    const result = await client.eval(LOCK_RELEASE_SCRIPT, [lockKey], [token]);

    if (result === 1) {
      this.emit(REDIS_EVENTS.LOCK_RELEASED, { resource, token });
      return true;
    }
    return false;
  }

  /**
   * Check if a resource is currently locked.
   *
   * @param resource - The resource identifier.
   * @returns `true` if locked.
   */
  public async isLocked(resource: string): Promise<boolean> {
    const client = await this.manager.connection();
    const exists = await client.exists(`lock:${resource}`);
    return exists > 0;
  }

  /**
   * Emit a lock event (fail-open).
   *
   * @param event - Event name.
   * @param payload - Event payload.
   */
  private emit(event: string, payload: unknown): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, payload);
    } catch {
      // Fail-open
    }
  }
}
