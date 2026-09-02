import type { HealthCheckContext, HealthCheckResult } from "./health.types.js";
export interface HealthCheck { check(context: HealthCheckContext): Promise<HealthCheckResult> | HealthCheckResult; }
