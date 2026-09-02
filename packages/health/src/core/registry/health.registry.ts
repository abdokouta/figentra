import type { HealthRegistry } from "../contracts/health-registry.interface.js";
import type { HealthIndicator, HealthProbe } from "../contracts/health.types.js";
import { HealthConfigurationError } from "../errors/health.errors.js";

export class DefaultHealthRegistry implements HealthRegistry {
  private readonly indicators = new Map<string, HealthIndicator>();
  register(indicator: HealthIndicator): void {
    if (!indicator.name.trim()) throw new HealthConfigurationError("Health indicator name is required");
    if (this.indicators.has(indicator.name)) throw new HealthConfigurationError(`Health indicator '${indicator.name}' is already registered`);
    this.indicators.set(indicator.name, Object.freeze({ ...indicator, probes: [...indicator.probes], tags: indicator.tags ? [...indicator.tags] : undefined }));
  }
  unregister(name: string): boolean { return this.indicators.delete(name); }
  get(name: string): HealthIndicator | undefined { return this.indicators.get(name); }
  all(): readonly HealthIndicator[] { return [...this.indicators.values()]; }
  forProbe(probe: HealthProbe): readonly HealthIndicator[] { return probe === "all" ? this.all() : this.all().filter((indicator) => indicator.probes.includes(probe) || indicator.probes.includes("all")); }
}
