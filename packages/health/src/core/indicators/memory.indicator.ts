import type { HealthIndicator, HealthRuntime } from "../contracts/health.types.js";
export interface MemoryHealthOptions { readonly heapThreshold?: number; readonly rssThreshold?: number; readonly probes?: readonly ("liveness" | "readiness" | "startup")[]; readonly failurePolicy?: "critical" | "degraded" | "ignore"; }
export class MemoryHealthIndicator implements HealthIndicator {
  readonly name = "memory";
  readonly probes: readonly ("liveness" | "readiness" | "startup")[];
  readonly failurePolicy: "critical" | "degraded" | "ignore";
  constructor(private readonly runtime: HealthRuntime, private readonly options: MemoryHealthOptions = {}) { this.probes = options.probes ?? ["liveness", "readiness", "startup"]; this.failurePolicy = options.failurePolicy ?? "critical"; }
  async check() {
    if (!this.runtime.memory) return { status: "unknown" as const, message: "Memory metrics are not available in this runtime" };
    const memory = await this.runtime.memory();
    const failures: string[] = [];
    if (memory.heapUsed !== undefined && this.options.heapThreshold !== undefined && memory.heapUsed > this.options.heapThreshold) failures.push("heap");
    if (memory.rss !== undefined && this.options.rssThreshold !== undefined && memory.rss > this.options.rssThreshold) failures.push("rss");
    return { status: failures.length ? "down" as const : "up" as const, message: failures.length ? `Memory threshold exceeded: ${failures.join(", ")}` : undefined, details: { ...memory } };
  }
}
