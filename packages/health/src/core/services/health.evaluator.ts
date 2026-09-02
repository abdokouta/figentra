import type { HealthIndicator, HealthCheckContext, HealthCheckResult, HealthProbe, HealthReport } from "../contracts/health.types.js";
import { DEFAULT_HEALTH_TIMEOUT_MS } from "../constants/health.constants.js";
import { HealthTimeoutError } from "../errors/health.errors.js";

export interface HealthEvaluatorOptions { readonly timeoutMs?: number; }
export class HealthEvaluator {
  constructor(private readonly options: HealthEvaluatorOptions = {}) {}
  async evaluate(indicators: readonly HealthIndicator[], probe: HealthProbe, metadata?: Readonly<Record<string, unknown>>): Promise<HealthReport> {
    const started = performance.now();
    const entries = await Promise.all(indicators.map(async (indicator) => [indicator.name, await this.evaluateIndicator(indicator, { probe, metadata })] as const));
    const checks = Object.fromEntries(entries);
    return { status: this.aggregate(indicators, checks), probe, timestamp: new Date().toISOString(), durationMs: Math.round((performance.now() - started) * 100) / 100, checks };
  }
  private async evaluateIndicator(indicator: HealthIndicator, context: HealthCheckContext): Promise<HealthCheckResult> {
    const started = performance.now();
    const timeoutMs = indicator.timeoutMs ?? this.options.timeoutMs ?? DEFAULT_HEALTH_TIMEOUT_MS;
    const controller = new AbortController();
    if (context.signal) context.signal.addEventListener("abort", () => controller.abort(context.signal?.reason), { once: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        Promise.resolve(indicator.check({ ...context, signal: controller.signal })),
        new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new HealthTimeoutError(indicator.name, timeoutMs)); }, timeoutMs); }),
      ]);
      return { ...result, latencyMs: result.latencyMs ?? Math.round((performance.now() - started) * 100) / 100 };
    } catch (error) {
      return { status: "down", message: error instanceof Error ? error.message : "Health indicator failed", latencyMs: Math.round((performance.now() - started) * 100) / 100, details: { error: error instanceof Error ? error.name : typeof error } };
    } finally { if (timer) clearTimeout(timer); }
  }
  private aggregate(indicators: readonly HealthIndicator[], checks: Readonly<Record<string, HealthCheckResult>>): HealthReport["status"] {
    if (indicators.length === 0) return "unknown";
    let degraded = false;
    for (const indicator of indicators) {
      const result = checks[indicator.name];
      if (!result || result.status === "unknown") { degraded = true; continue; }
      if (result.status === "down") {
        const policy = indicator.failurePolicy ?? (indicator.critical === false ? "degraded" : "critical");
        if (policy === "critical") return "down";
        if (policy === "degraded") degraded = true;
      }
      if (result.status === "degraded") degraded = true;
    }
    return degraded ? "degraded" : "up";
  }
}
