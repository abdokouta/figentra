/**
 * @file aggregate-status.util.ts
 * @module @stackra/nestjs-health/utils
 * @description Worst-status computation for health check results.
 */

import { HealthStatus } from '@stackra/contracts';

/**
 * Status priority (higher = worse).
 */
const STATUS_PRIORITY: Record<HealthStatus, number> = {
  [HealthStatus.UP]: 0,
  [HealthStatus.UNKNOWN]: 1,
  [HealthStatus.DEGRADED]: 2,
  [HealthStatus.DOWN]: 3,
};

/**
 * Compute the aggregate health status from an array of individual statuses.
 *
 * Uses worst-status strategy:
 * - Any `down` → aggregate is `down`
 * - Any `degraded` or `unknown` (without `down`) → aggregate is `degraded`
 * - All `up` → aggregate is `up`
 * - Empty array → `up` (no indicators = healthy)
 *
 * @param statuses - Array of individual health statuses
 * @returns The computed aggregate status
 */
export function computeAggregateStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.length === 0) {
    return HealthStatus.UP;
  }

  let worstPriority = 0;

  for (const status of statuses) {
    const priority = STATUS_PRIORITY[status] ?? 0;
    if (priority > worstPriority) {
      worstPriority = priority;
    }
  }

  // Map priority back to status
  if (worstPriority >= STATUS_PRIORITY[HealthStatus.DOWN]) {
    return HealthStatus.DOWN;
  }
  if (worstPriority >= STATUS_PRIORITY[HealthStatus.DEGRADED]) {
    return HealthStatus.DEGRADED;
  }
  if (worstPriority >= STATUS_PRIORITY[HealthStatus.UNKNOWN]) {
    return HealthStatus.DEGRADED; // unknown is treated as degraded per spec
  }

  return HealthStatus.UP;
}
