/**
 * @file index.ts
 * @module @stackra/nestjs-health/testing
 * @description Barrel export for health testing utilities.
 *
 * Import from '@stackra/nestjs-health/testing' subpath:
 * ```typescript
 * import { FakeIndicator, createMockHealthModule, assertHealthy } from '@stackra/nestjs-health/testing';
 * ```
 */
export { FakeIndicator } from './fake-indicator';
export { createMockHealthModule } from './mock-health-module';
export { assertHealthy, assertDegraded, assertDown } from './assertion-helpers';
