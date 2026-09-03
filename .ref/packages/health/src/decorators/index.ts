/**
 * @file index.ts
 * @module @stackra/nestjs-health/decorators
 * @description Barrel export for health decorators.
 */
export { HealthIndicator } from './health-indicator.decorator';
export type {
  IHealthIndicatorDecoratorOptions,
  IHealthIndicatorMetadata,
} from './health-indicator.decorator';
