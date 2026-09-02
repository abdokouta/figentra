import type { HealthIndicator, HealthProbe } from "./health.types.js";

export interface HealthRegistry {
  register(indicator: HealthIndicator): void;
  unregister(name: string): boolean;
  get(name: string): HealthIndicator | undefined;
  all(): readonly HealthIndicator[];
  forProbe(probe: HealthProbe): readonly HealthIndicator[];
}
