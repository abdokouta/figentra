/**
 * @file mock-health-module.ts
 * @module @stackra/nestjs-health/testing
 * @description Pre-configured health module for testing.
 */

import { NestHealthModule } from '../nest-health.module';
import type { IHealthModuleOptions } from '../interfaces';
import type { IDynamicModule } from '@nestjs/common';

/**
 * Create a pre-configured health module for testing.
 *
 * - Uses InMemoryResultStore (default)
 * - No scheduled execution
 * - All probes enabled
 * - No guards
 *
 * @param overrides - Optional configuration overrides
 * @returns Dynamic module ready for testing
 */
export function createMockHealthModule(
  overrides: Partial<IHealthModuleOptions> = {}
): IDynamicModule {
  // Reset the singleton guard for test isolation
  NestHealthModule.resetForTesting();

  return NestHealthModule.forRoot({
    schedule: undefined, // No scheduled execution
    guards: [], // No authentication
    ...overrides,
  });
}
