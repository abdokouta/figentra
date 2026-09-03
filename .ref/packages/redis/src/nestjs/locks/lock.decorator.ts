/**
 * @file lock.decorator.ts
 * @module @stackra/nestjs-redis/locks
 * @description Method decorator that acquires a distributed lock before
 *   execution and releases it after completion or on error.
 */

import { Inject } from '@nestjs/common';
import type { ILockOptions } from '@stackra/contracts';
import { REDIS_LOCK_SERVICE } from '@stackra/contracts';

/**
 * Acquire a distributed lock before method execution.
 *
 * The lock is acquired before the method runs and released after
 * completion (success or error). If the lock cannot be acquired
 * within the timeout, a `LockTimeoutError` is thrown.
 *
 * @param resource - The resource identifier to lock.
 * @param options - Lock configuration (ttl, timeout, retries).
 * @returns A method decorator.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class PaymentService {
 *   @Lock('payment:process', { ttl: 30000 })
 *   async processPayment(orderId: string): Promise<void> {
 *     // This method is protected by a distributed lock
 *   }
 * }
 * ```
 */
export function Lock(resource: string, options?: ILockOptions): MethodDecorator {
  const injectLock = Inject(REDIS_LOCK_SERVICE);

  return function (
    target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    // Ensure the lock service is injected
    injectLock(target, '__lockService__', 0);

    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: unknown[]) {
      const lockService = this.__lockService__;
      if (!lockService) {
        throw new Error('@Lock decorator requires LockService to be injected.');
      }

      const lock = await lockService.acquire(resource, options);

      try {
        return await originalMethod.apply(this, args);
      } finally {
        await lock.release();
      }
    };

    return descriptor;
  };
}
