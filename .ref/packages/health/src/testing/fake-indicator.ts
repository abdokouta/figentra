/**
 * @file fake-indicator.ts
 * @module @stackra/nestjs-health/testing
 * @description Fake health indicator for testing.
 */

import { IInjectable } from '@nestjs/common';
import { HealthStatus } from '@stackra/contracts';
import type { IHealthIndicator, HealthIndicatorResult } from '@stackra/contracts';

/**
 * Fake health indicator for testing.
 *
 * Returns a configurable static result or invokes a factory function
 * on each `check()` call. Useful for integration tests that need
 * to control indicator behavior without real infrastructure.
 *
 * @example
 * ```typescript
 * const fake = new FakeIndicator({ 'my-service': { status: 'up' } });
 * const result = await fake.check('my-service');
 * // result === { 'my-service': { status: 'up' } }
 * ```
 */
@IInjectable()
export class FakeIndicator implements IHealthIndicator {
  private readonly staticResult?: HealthIndicatorResult;
  private readonly factory?: (
    key: string
  ) => HealthIndicatorResult | Promise<HealthIndicatorResult>;

  /**
   * @param resultOrFactory - Static result or factory function
   */
  public constructor(
    resultOrFactory:
      | HealthIndicatorResult
      | ((key: string) => HealthIndicatorResult | Promise<HealthIndicatorResult>)
  ) {
    if (typeof resultOrFactory === 'function') {
      this.factory = resultOrFactory;
    } else {
      this.staticResult = resultOrFactory;
    }
  }

  /**
   * Return the configured result.
   *
   * @param key - Result key passed to factory (if using factory mode)
   * @returns The configured health indicator result
   */
  public async check(key?: string): Promise<HealthIndicatorResult> {
    if (this.factory) {
      return this.factory(key ?? 'fake');
    }
    return this.staticResult ?? { [key ?? 'fake']: { status: HealthStatus.UP } };
  }
}
