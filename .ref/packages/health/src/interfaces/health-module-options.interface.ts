/**
 * @file health-module-options.interface.ts
 * @module @stackra/nestjs-health/interfaces
 * @description Configuration options for `NestHealthModule.forRoot()`.
 */

import type { IType, ICanActivate } from '@nestjs/common';
import type {
  HealthProbe,
  IResultStore,
  IHealthMetrics,
  IAggregatedHealthResult,
} from '@stackra/contracts';

/**
 * Configuration options for `NestHealthModule.forRoot()`.
 *
 * All fields are optional — sensible defaults are applied for each.
 * See `src/constants/defaults.constant.ts` for all default values.
 */
export interface IHealthModuleOptions {
  /** Base URL path for health endpoints. @default "health" */
  basePath?: string;

  /** Enable or disable individual K8s probe endpoints. */
  probes?: {
    /** Liveness probe endpoint. @default true */
    liveness?: boolean;
    /** Readiness probe endpoint. @default true */
    readiness?: boolean;
    /** Startup probe endpoint. @default true */
    startup?: boolean;
  };

  /** Execution engine configuration. */
  execution?: {
    /** Execution mode. @default 'parallel' */
    mode?: 'parallel' | 'sequential';
    /** Concurrency limit for parallel mode (1–50). @default 5 */
    concurrency?: number;
    /** Default per-indicator timeout in milliseconds. @default 5000 */
    timeout?: number;
    /** Retry configuration for failed checks. */
    retry?: {
      /** Maximum retry attempts. @default 3 */
      maxAttempts?: number;
      /** Delay between retries in milliseconds. @default 1000 */
      delay?: number;
    };
  };

  /** Cron expression or interval in ms (min 1000) for scheduled execution. */
  schedule?: string | number;

  /** Result store class to use. @default InMemoryResultStore */
  resultStore?: IType<IResultStore>;

  /** Options passed to the result store constructor. */
  resultStoreOptions?: Record<string, unknown>;

  /** NestJS guard classes to apply to health endpoints. */
  guards?: IType<ICanActivate>[];

  /** Probe endpoints that remain unguarded. @default ['liveness'] */
  publicProbes?: HealthProbe[];

  /** Response format. @default 'full' */
  responseFormat?: 'full' | 'simple' | ((result: IAggregatedHealthResult) => unknown);

  /** Notification configuration. */
  notification?: {
    /** Minimum seconds between repeated alerts per indicator (1–86400). @default 300 */
    cooldown?: number;
  };

  /** Optional metrics interface for telemetry. */
  metrics?: IHealthMetrics;

  /** Memory indicator thresholds. */
  memory?: {
    /** Heap usage threshold in bytes. @default 314572800 (300MB) */
    heapThreshold?: number;
    /** RSS usage threshold in bytes. @default 629145600 (600MB) */
    rssThreshold?: number;
  };

  /** Disk indicator thresholds. */
  disk?: {
    /** Filesystem path to monitor. @default "/" */
    path?: string;
    /** Usage percentage threshold (1–100). @default 90 */
    threshold?: number;
  };

  /** Queue indicator thresholds. */
  queue?: {
    /** Maximum waiting jobs before unhealthy. */
    maxWaiting?: number;
    /** Maximum failed jobs before unhealthy. */
    maxFailed?: number;
  };

  /** @nestjs/terminus indicator functions to run alongside native indicators. */
  terminus?: {
    liveness?: Array<() => Promise<unknown>>;
    readiness?: Array<() => Promise<unknown>>;
    startup?: Array<() => Promise<unknown>>;
  };

  /** Whether to enable admin API endpoints. @default true */
  admin?: boolean;
}
