import type { HealthServiceContract } from "./health.service.types.js";
import type { HealthIndicator, HealthProbe, HealthCheckContext, HealthReport } from "../contracts/health.types.js";
import { DefaultHealthRegistry } from "../registry/health.registry.js";
import { HealthEvaluator, type HealthEvaluatorOptions } from "./health.evaluator.js";
export interface CreateHealthServiceOptions extends HealthEvaluatorOptions { readonly indicators?: readonly HealthIndicator[]; }
export class DefaultHealthService implements HealthServiceContract {
  readonly registry = new DefaultHealthRegistry();
  private readonly evaluator: HealthEvaluator;
  constructor(options: CreateHealthServiceOptions = {}) { this.evaluator = new HealthEvaluator(options); for (const indicator of options.indicators ?? []) this.registry.register(indicator); }
  register(indicator: HealthIndicator): this { this.registry.register(indicator); return this; }
  unregister(name: string): boolean { return this.registry.unregister(name); }
  check(probe: HealthProbe = "all", context?: HealthCheckContext): Promise<HealthReport> { return this.evaluator.evaluate(this.registry.forProbe(probe), probe, context?.metadata); }
}
