/**
 * @file health-indicator-decorator-options.interface.ts
 * @module @stackra/health/src/interfaces
 * @description IHealthIndicatorDecoratorOptions interface.
 */

/**
 * Options for the @HealthIndicator() decorator.
 */
export interface IHealthIndicatorDecoratorOptions {
  /** Probes this indicator is assigned to. Defaults to all three if omitted. */
  probes?: HealthProbe[];
  /** Optional metadata key-value pairs. */
  metadata?: Record<string, string>;
  /** Conditional execution function. Returns false to skip this indicator. */
  when?: () => boolean;
  /** Per-indicator timeout override in milliseconds. */
  timeout?: number;
  /** Retry configuration for this indicator. */
  retry?: { maxAttempts?: number; delay?: number };
  /** Per-indicator schedule override (cron expression or interval ms). */
  schedule?: string | number;
}
