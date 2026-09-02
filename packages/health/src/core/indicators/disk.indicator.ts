import type { HealthIndicator, HealthRuntime } from "../contracts/health.types.js";
export interface DiskHealthOptions { readonly path?: string; readonly thresholdPercent?: number; readonly probes?: readonly ("readiness" | "startup")[]; readonly failurePolicy?: "critical" | "degraded" | "ignore"; }
export class DiskHealthIndicator implements HealthIndicator {
  readonly name = "disk";
  readonly probes: readonly ("readiness" | "startup")[];
  readonly failurePolicy: "critical" | "degraded" | "ignore";
  constructor(private readonly runtime: HealthRuntime, private readonly options: DiskHealthOptions = {}) { this.probes = options.probes ?? ["readiness", "startup"]; this.failurePolicy = options.failurePolicy ?? "critical"; }
  async check() {
    if (!this.runtime.disk) return { status: "unknown" as const, message: "Disk metrics are not available in this runtime" };
    const path = this.options.path ?? "/";
    const snapshot = await this.runtime.disk(path);
    const percentage = snapshot.totalBytes > 0 ? snapshot.usedBytes / snapshot.totalBytes : 1;
    const threshold = this.options.thresholdPercent ?? 0.9;
    return { status: percentage <= threshold ? "up" as const : "down" as const, message: percentage <= threshold ? undefined : "Disk usage exceeds threshold", details: { path, usedBytes: snapshot.usedBytes, totalBytes: snapshot.totalBytes, percentage, thresholdPercent: threshold } };
  }
}
