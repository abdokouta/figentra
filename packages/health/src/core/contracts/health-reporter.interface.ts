import type { HealthReport } from "./health.types.js";
export interface HealthReporter { report(report: HealthReport): void | Promise<void>; }
