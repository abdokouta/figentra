export const HEALTH_PROBES = ["liveness", "readiness", "startup"] as const;
export type HealthProbe = (typeof HEALTH_PROBES)[number] | "all";
export type HealthStatus = "up" | "down" | "degraded" | "unknown";
export type HealthFailurePolicy = "critical" | "degraded" | "ignore";

export interface HealthCheckContext { probe: HealthProbe; signal?: AbortSignal; metadata?: Readonly<Record<string, unknown>>; }
export interface HealthCheckResult { status: HealthStatus; message?: string; latencyMs?: number; details?: Readonly<Record<string, unknown>>; }
export interface HealthIndicatorMetadata { readonly name: string; readonly probes: readonly HealthProbe[]; readonly critical?: boolean; readonly failurePolicy?: HealthFailurePolicy; readonly timeoutMs?: number; readonly description?: string; readonly tags?: readonly string[]; }
export interface HealthIndicator extends HealthIndicatorMetadata { check(context: HealthCheckContext): Promise<HealthCheckResult> | HealthCheckResult; }
export interface HealthReport { readonly status: HealthStatus; readonly probe: HealthProbe; readonly timestamp: string; readonly durationMs: number; readonly checks: Readonly<Record<string, HealthCheckResult>>; }
export interface HealthRuntime { memory?(): MemorySnapshot | Promise<MemorySnapshot>; disk?(path: string): DiskSnapshot | Promise<DiskSnapshot>; }
export interface MemorySnapshot { readonly heapUsed?: number; readonly heapTotal?: number; readonly rss?: number; readonly external?: number; readonly arrayBuffers?: number; }
export interface DiskSnapshot { readonly usedBytes: number; readonly totalBytes: number; }
