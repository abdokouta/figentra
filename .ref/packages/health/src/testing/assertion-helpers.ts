/**
 * @file assertion-helpers.ts
 * @module @stackra/nestjs-health/testing
 * @description Assertion helpers for health check results in tests.
 */

import { HealthStatus } from '@stackra/contracts';
import type { IAggregatedHealthResult } from '@stackra/contracts';

/**
 * Assert that the aggregated health result has status `up`.
 *
 * @param result - The aggregated health result to check
 * @throws Error if status is not `up`, with details about which indicators are not up
 */
export function assertHealthy(result: IAggregatedHealthResult): void {
  if (result.status === HealthStatus.UP) return;

  const nonUp = Object.entries(result.results)
    .filter(([_, r]) => r.status !== HealthStatus.UP)
    .map(([name, r]) => `${name}=${r.status}`)
    .join(', ');

  throw new Error(
    `Expected aggregate status "up" but got "${result.status}". Non-up indicators: ${nonUp}`
  );
}

/**
 * Assert that the aggregated health result has status `degraded`.
 *
 * @param result - The aggregated health result to check
 * @throws Error if status is not `degraded`
 */
export function assertDegraded(result: IAggregatedHealthResult): void {
  if (result.status === HealthStatus.DEGRADED) return;

  throw new Error(`Expected aggregate status "degraded" but got "${result.status}".`);
}

/**
 * Assert that the aggregated health result has status `down`.
 *
 * @param result - The aggregated health result to check
 * @throws Error if status is not `down`
 */
export function assertDown(result: IAggregatedHealthResult): void {
  if (result.status === HealthStatus.DOWN) return;

  throw new Error(`Expected aggregate status "down" but got "${result.status}".`);
}
