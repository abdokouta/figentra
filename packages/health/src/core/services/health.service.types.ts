import type { HealthIndicator, HealthProbe, HealthCheckContext, HealthReport } from "../contracts/health.types.js";
import type { HealthRegistry } from "../contracts/health-registry.interface.js";
export interface HealthServiceContract { readonly registry: HealthRegistry; register(indicator: HealthIndicator): this; unregister(name: string): boolean; check(probe?: HealthProbe, context?: HealthCheckContext): Promise<HealthReport>; }
