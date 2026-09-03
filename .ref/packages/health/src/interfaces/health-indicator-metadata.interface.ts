/**
 * @file health-indicator-metadata.interface.ts
 * @module @stackra/health/src/interfaces
 * @description IHealthIndicatorMetadata interface.
 */

/**
 * Metadata shape stored by the @HealthIndicator() decorator.
 */
export interface IHealthIndicatorMetadata {
  /** Indicator name (1-64 chars, [a-zA-Z0-9_-]). */
  name: string;
  /** Decorator options. */
  options: IHealthIndicatorDecoratorOptions;
}
