/**
 * @file index.ts
 * @module @stackra/nestjs-health
 * @description Public API for the @stackra/nestjs-health package.
 *
 * Production-ready health check module for NestJS with Kubernetes probes,
 * auto-discovery, pluggable storage, scheduling, and alerting.
 *
 * @example
 * ```typescript
 * import { NestHealthModule } from '@stackra/nestjs-health';
 *
 * @Module({
 *   imports: [NestHealthModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 */

// ============================================================================
// Module
// ============================================================================
export { NestHealthModule } from './nest-health.module';

// ============================================================================
// Re-exports from @stackra/contracts (convenience)
// ============================================================================
export {
  HealthStatus,
  HealthProbe,
  HEALTH_EVENTS,
  HEALTH_INDICATOR_METADATA_KEY,
} from '@stackra/contracts';

export type {
  IHealthIndicator,
  HealthIndicatorResult,
  IHealthResult,
  IAggregatedHealthResult,
  IResultStore,
  IHealthMetrics,
  IIndicatorStatusEvent,
  ISystemStatusEvent,
} from '@stackra/contracts';

// ============================================================================
// Decorators
// ============================================================================
export { HealthIndicator } from './decorators';

// ============================================================================
// Services
// ============================================================================
export { HealthRunnerService } from './services';
export { IndicatorLoaderService } from './services';
export { CooldownTrackerService } from './services';
export { SchedulerService } from './services';

// ============================================================================
// Registries
// ============================================================================
export { IndicatorRegistry } from './registries';

// ============================================================================
// Stores
// ============================================================================
export { InMemoryResultStore } from './stores';
export { RedisResultStore, HEALTH_REDIS_CONNECTION } from './stores';
export {
  DatabaseResultStore,
  HEALTH_ENTITY_MANAGER,
  type IDatabaseResultStoreConfig,
} from './stores';

// ============================================================================
// Built-in Indicators (foundational only)
// ============================================================================
export {
  MemoryHealthIndicator,
  DiskHealthIndicator,
  EventLoopLagIndicator,
  ProcessUptimeIndicator,
} from './indicators';

// ============================================================================
// Factories
// ============================================================================
export { createHealthController } from './factories';

// ============================================================================
// Errors
// ============================================================================
export { DuplicateModuleError, InvalidIndicatorNameError, InvalidConfigError } from './errors';

// ============================================================================
// Internal Constants (module-level tokens)
// ============================================================================
export { HEALTH_MODULE_OPTIONS, HEALTH_RESULT_STORE, HEALTH_METRICS } from './constants';

// ============================================================================
// Internal Interfaces (module configuration)
// ============================================================================
export type { IIndicatorRegistration } from './interfaces';

// ============================================================================
// Utils (exported for advanced usage and testing)
// ============================================================================
export { computeAggregateStatus, isValidIndicatorName } from './utils';
