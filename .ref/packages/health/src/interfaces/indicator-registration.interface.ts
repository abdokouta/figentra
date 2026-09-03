/**
 * @file indicator-registration.interface.ts
 * @module @stackra/nestjs-health/interfaces
 * @description Shape of a registered health indicator entry in the registry.
 */

import type { IType } from '@nestjs/common';
import type { HealthProbe, IHealthIndicator } from '@stackra/contracts';

/**
 * A registered health indicator entry in the IndicatorRegistry.
 *
 * Populated during auto-discovery (via @HealthIndicator() decorator)
 * or manual registration (via forFeature()).
 */
export interface IIndicatorRegistration {
  /** Unique indicator name (1-64 chars, [a-zA-Z0-9_-]). */
  name: string;

  /** Probes this indicator is assigned to. */
  probes: HealthProbe[];

  /** Class reference for DI resolution (used as fallback if instance not cached). */
  classRef: IType<IHealthIndicator>;

  /** Resolved indicator instance (populated during discovery). */
  instance?: IHealthIndicator;

  /** Optional metadata key-value pairs. */
  metadata?: Record<string, string>;

  /** Optional conditional execution function. Returns false to skip. */
  when?: () => boolean;

  /** Per-indicator timeout override in milliseconds. */
  timeout?: number;

  /** Per-indicator retry configuration. */
  retry?: { maxAttempts?: number; delay?: number };

  /** Per-indicator schedule override (cron expression or interval ms). */
  schedule?: string | number;
}
