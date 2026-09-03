/**
 * @file health-runner.service.ts
 * @module @stackra/nestjs-health/services
 * @description Orchestration service for executing health indicators.
 *
 * Executes indicators in parallel or sequentially, handles timeouts, retries,
 * computes aggregate status, stores results, and emits status transition events.
 *
 * @todo Replace `IPUBSUB_SERVICE` manual Symbol with import from
 *   `@stackra/contracts` once `@stackra/nestjs-pubsub` tokens are standardized.
 * @todo Integrate with `@stackra/ts-events` for typed event emission once the
 *   events package has NestJS adapter parity with IPubSubDriver.
 */

import { IInjectable, Inject, Optional, Logger } from '@nestjs/common';
import { sleep, Arr } from '@stackra/ts-support';
import { HealthStatus, HealthProbe, HEALTH_EVENTS } from '@stackra/contracts';
import type {
  IHealthResult,
  IAggregatedHealthResult,
  IHealthIndicator,
  IResultStore,
  IHealthMetrics,
  IIndicatorStatusEvent,
  ISystemStatusEvent,
} from '@stackra/contracts';
import {
  HEALTH_MODULE_OPTIONS,
  HEALTH_RESULT_STORE,
  HEALTH_METRICS,
  DEFAULT_INDICATOR_TIMEOUT,
  DEFAULT_CONCURRENCY,
  DEFAULT_RETRY_MAX_ATTEMPTS,
  DEFAULT_RETRY_DELAY,
} from '../constants';
import { computeAggregateStatus } from '../utils';
import { IndicatorRegistry } from '../registries';
import { CooldownTrackerService } from './cooldown-tracker.service';
import type { IHealthModuleOptions, IIndicatorRegistration } from '../interfaces';

/** DI token for optional IPubSubDriver. */
import { IPUBSUB_SERVICE } from '@stackra/contracts';

/**
 * Health check execution engine.
 *
 * Features:
 * - Parallel/sequential execution modes
 * - Per-indicator timeout with cancellation
 * - Retry logic with configurable delay
 * - Aggregate status computation (worst-status strategy)
 * - Result storage via pluggable IResultStore
 * - Event emission via IPubSubDriver on status transitions
 * - Cooldown-based alert suppression
 * - Pause/resume controls for individual or all indicators
 * - Conditional execution via `when()` functions
 * - Structured logging at info/warning/debug levels
 * - Optional metrics recording
 */
@IInjectable()
export class HealthRunnerService {
  private readonly logger = new Logger(HealthRunnerService.name);
  private readonly previousStatuses = new Map<string, HealthStatus>();
  private previousAggregateStatus: HealthStatus = HealthStatus.UNKNOWN;
  private globalPaused = false;

  /**
   * @param options - Module configuration
   * @param registry - The indicator registry
   * @param cooldownTracker - Cooldown tracker for alert suppression
   * @param resultStore - Pluggable result store
   * @param pubsub - Optional IPubSubDriver for event emission
   * @param metrics - Optional metrics interface
   */
  public constructor(
    @Inject(HEALTH_MODULE_OPTIONS) private readonly options: IHealthModuleOptions,
    private readonly registry: IndicatorRegistry,
    private readonly cooldownTracker: CooldownTrackerService,
    @Inject(HEALTH_RESULT_STORE) private readonly resultStore: IResultStore,
    @Optional() @Inject(IPUBSUB_SERVICE) private readonly pubsub?: any,
    @Optional() @Inject(HEALTH_METRICS) private readonly metrics?: IHealthMetrics
  ) {}

  /**
   * Execute all registered indicators.
   *
   * @returns Aggregated health result
   */
  public async runAll(): Promise<IAggregatedHealthResult> {
    const indicators = this.registry.getAll();
    return this.executeIndicators(indicators);
  }

  /**
   * Execute indicators assigned to a specific probe.
   *
   * @param probe - The probe to run
   * @returns Aggregated health result
   */
  public async runProbe(probe: HealthProbe): Promise<IAggregatedHealthResult> {
    const indicators = this.registry.getByProbe(probe);
    return this.executeIndicators(indicators);
  }

  /**
   * Execute a single indicator by name.
   *
   * @param name - The indicator name
   * @returns The individual health result
   * @throws Error if indicator name not found
   */
  public async runSingle(name: string): Promise<IHealthResult> {
    const entry = this.registry.getByName(name);
    if (!entry) {
      throw new Error(`Health indicator "${name}" not found.`);
    }

    const instance = this.resolveInstance(entry);
    return this.executeOne(entry, instance);
  }

  /**
   * Suspend all indicator executions.
   */
  public pauseAll(): void {
    this.globalPaused = true;
  }

  /**
   * Resume all indicator executions.
   */
  public resumeAll(): void {
    this.globalPaused = false;
  }

  /**
   * Pause a specific indicator.
   *
   * @param name - The indicator name
   * @throws Error if name not registered
   */
  public pause(name: string): void {
    if (!this.registry.has(name)) {
      throw new Error(`Health indicator "${name}" is not registered.`);
    }
    this.registry.pause(name);
  }

  /**
   * Resume a specific indicator.
   *
   * @param name - The indicator name
   * @throws Error if name not registered
   */
  public resume(name: string): void {
    if (!this.registry.has(name)) {
      throw new Error(`Health indicator "${name}" is not registered.`);
    }
    this.registry.resume(name);
  }

  // ============================================================================
  // Private execution logic
  // ============================================================================

  /**
   * Execute a set of indicators and produce an aggregated result.
   *
   * @param indicators - Indicators to execute
   * @returns Aggregated health result
   */
  private async executeIndicators(
    indicators: IIndicatorRegistration[]
  ): Promise<IAggregatedHealthResult> {
    const startTime = Date.now();
    const results: Record<string, IHealthResult> = {};

    // Filter out paused, globally paused, and conditional indicators
    const runnableIndicators = indicators.filter((entry) => {
      if (this.globalPaused) return false;
      if (this.registry.isPaused(entry.name)) return false;
      if (entry.when) {
        try {
          if (!entry.when()) return false;
        } catch (err: Error | any) {
          this.logger.warn(
            `when() function threw for indicator "${entry.name}": ${(err as Error).message}`
          );
          return false;
        }
      }
      return true;
    });

    const mode = this.options.execution?.mode ?? 'parallel';

    if (mode === 'sequential') {
      for (const entry of runnableIndicators) {
        const instance = this.resolveInstance(entry);
        const result = await this.executeOne(entry, instance);
        results[entry.name] = result;
      }
    } else {
      const concurrency = this.options.execution?.concurrency ?? DEFAULT_CONCURRENCY;
      const chunks = Arr.chunk(runnableIndicators, concurrency);

      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(async (entry) => {
            const instance = this.resolveInstance(entry);
            const result = await this.executeOne(entry, instance);
            return { name: entry.name, result };
          })
        );
        for (const { name, result } of chunkResults) {
          results[name] = result;
        }
      }
    }

    // Compute aggregate
    const statuses = Object.values(results).map((r) => r.status);
    const aggregateStatus = computeAggregateStatus(statuses);
    const duration = Date.now() - startTime;

    const aggregated: IAggregatedHealthResult = {
      status: aggregateStatus,
      timestamp: new Date(),
      results,
      duration,
    };

    // Log the overall result
    this.logger.log(
      `Health check complete: status=${aggregateStatus}, indicators=${Object.keys(results).length}, duration=${duration}ms`
    );

    // Store result
    try {
      await this.resultStore.store(aggregated);
    } catch (err: Error | any) {
      this.logger.warn(`Failed to store health result: ${(err as Error).message}`);
    }

    // Emit events for status transitions
    this.emitStatusTransitions(results, aggregateStatus);

    return aggregated;
  }

  /**
   * Execute a single indicator with timeout and retry logic.
   *
   * @param entry - The indicator registration
   * @param instance - The resolved indicator instance
   * @returns The health result
   */
  private async executeOne(
    entry: IIndicatorRegistration,
    instance: IHealthIndicator
  ): Promise<IHealthResult> {
    const timeout = entry.timeout ?? this.options.execution?.timeout ?? DEFAULT_INDICATOR_TIMEOUT;
    const retryConfig = entry.retry ?? this.options.execution?.retry;
    const maxAttempts = retryConfig?.maxAttempts ?? DEFAULT_RETRY_MAX_ATTEMPTS;
    const retryDelay = retryConfig?.delay ?? DEFAULT_RETRY_DELAY;

    const startedAt = new Date();
    this.logger.debug(`Starting health check: "${entry.name}"`);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const rawResult = await this.withTimeout(instance.check(entry.name), timeout, entry.name);

        // Extract status from the raw result
        const status = this.extractStatus(rawResult, entry.name);
        const endedAt = new Date();
        const duration = endedAt.getTime() - startedAt.getTime();

        this.logger.debug(`Completed health check: "${entry.name}" → ${status} (${duration}ms)`);

        if (this.metrics) {
          this.metrics.recordDuration(entry.name, duration);
          this.metrics.incrementStatus(entry.name, status);
        }

        // If status is UP or DEGRADED, accept the result
        if (status !== HealthStatus.DOWN) {
          return {
            indicatorName: entry.name,
            status,
            startedAt,
            endedAt,
            duration,
            metadata: this.extractMetadata(rawResult, entry.name),
            message: this.extractMessage(rawResult, entry.name),
          };
        }

        // If DOWN and more attempts remain, retry
        if (attempt < maxAttempts) {
          lastError = new Error(`Indicator "${entry.name}" returned status down`);
          await sleep(retryDelay);
          continue;
        }

        // Last attempt, return down result
        return {
          indicatorName: entry.name,
          status: HealthStatus.DOWN,
          startedAt,
          endedAt,
          duration,
          metadata: this.extractMetadata(rawResult, entry.name),
          message: this.extractMessage(rawResult, entry.name),
        };
      } catch (err: Error | any) {
        lastError = err as Error;

        if (attempt < maxAttempts) {
          await sleep(retryDelay);
          continue;
        }
      }
    }

    // All attempts failed
    const endedAt = new Date();
    const duration = endedAt.getTime() - startedAt.getTime();

    this.logger.warn(
      `Health check "${entry.name}" failed after ${maxAttempts} attempts: ${lastError?.message}`
    );

    if (this.metrics) {
      this.metrics.recordDuration(entry.name, duration);
      this.metrics.incrementStatus(entry.name, HealthStatus.DOWN);
    }

    return {
      indicatorName: entry.name,
      status: HealthStatus.DOWN,
      startedAt,
      endedAt,
      duration,
      metadata: { error: true },
      message: lastError?.message ?? 'Check failed',
    };
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Resolve an indicator instance from the registry.
   * Instances are cached during auto-discovery by the IndicatorLoaderService.
   *
   * @param entry - The indicator registration
   * @returns The resolved instance
   * @throws Error if no instance is available
   */
  private resolveInstance(entry: IIndicatorRegistration): IHealthIndicator {
    if (!entry.instance) {
      throw new Error(
        `Health indicator "${entry.name}" has no resolved instance. ` +
          'Ensure NestContainerModule.forRoot() is imported and the indicator is discoverable.'
      );
    }
    return entry.instance;
  }

  /**
   * Wrap a promise with a timeout.
   *
   * @param promise - The promise to wrap
   * @param timeoutMs - Timeout in milliseconds
   * @param indicatorName - For error message context
   * @returns The promise result
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    indicatorName: string
  ): Promise<T> {
    let timer: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Health check "${indicatorName}" exceeded timeout of ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer!);
      return result;
    } catch (err: Error | any) {
      clearTimeout(timer!);
      throw err;
    }
  }

  /**
   * Extract the worst status from an indicator's raw result.
   *
   * @param rawResult - The raw indicator result record
   * @param defaultKey - Fallback key
   * @returns The worst status found in the result
   */
  private extractStatus(rawResult: Record<string, any>, _defaultKey: string): HealthStatus {
    const entries = Object.values(rawResult);
    if (entries.length === 0) return HealthStatus.UP;

    const statuses = entries.map((entry) => {
      const s = entry?.status;
      if (s === 'up' || s === HealthStatus.UP) return HealthStatus.UP;
      if (s === 'down' || s === HealthStatus.DOWN) return HealthStatus.DOWN;
      if (s === 'degraded' || s === HealthStatus.DEGRADED) return HealthStatus.DEGRADED;
      return HealthStatus.UNKNOWN;
    });

    return computeAggregateStatus(statuses);
  }

  /**
   * Extract metadata from the raw result.
   *
   * @param rawResult - The raw indicator result
   * @param key - The expected key
   * @returns Metadata record or undefined
   */
  private extractMetadata(
    rawResult: Record<string, any>,
    key: string
  ): Record<string, string | number | boolean> | undefined {
    const entry = rawResult[key] ?? Object.values(rawResult)[0];
    if (!entry) return undefined;

    const metadata: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(entry)) {
      if (k === 'status') continue;
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        metadata[k] = v;
      }
    }
    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

  /**
   * Extract message from the raw result.
   *
   * @param rawResult - The raw indicator result
   * @param key - The expected key
   * @returns Message string or undefined
   */
  private extractMessage(rawResult: Record<string, any>, key: string): string | undefined {
    const entry = rawResult[key] ?? Object.values(rawResult)[0];
    return entry?.message;
  }

  /**
   * Emit events for any status transitions detected.
   *
   * @param results - Current execution results
   * @param aggregateStatus - Current aggregate status
   */
  private emitStatusTransitions(
    results: Record<string, IHealthResult>,
    aggregateStatus: HealthStatus
  ): void {
    if (!this.pubsub) return;

    const timestamp = new Date().toISOString();

    // Check each indicator for transitions
    for (const [name, result] of Object.entries(results)) {
      const previous = this.previousStatuses.get(name) ?? HealthStatus.UNKNOWN;
      const current = result.status;

      if (previous === current) continue;

      // Record the new status
      this.previousStatuses.set(name, current);

      const payload: IIndicatorStatusEvent = {
        indicatorName: name,
        previousStatus: previous,
        newStatus: current,
        timestamp,
        metadata: result.metadata,
      };

      if (current === HealthStatus.DOWN) {
        if (this.cooldownTracker.shouldEmitDown(name)) {
          this.emit(HEALTH_EVENTS.INDICATOR_DOWN, payload);
          this.cooldownTracker.recordDownEmission(name);
        }
      } else if (current === HealthStatus.UP) {
        // Recovery events always fire immediately
        this.emit(HEALTH_EVENTS.INDICATOR_RECOVERED, payload);
        this.cooldownTracker.clear(name);
      } else if (current === HealthStatus.DEGRADED) {
        this.emit(HEALTH_EVENTS.INDICATOR_DEGRADED, payload);
      }
    }

    // Check aggregate status transition
    if (aggregateStatus !== this.previousAggregateStatus) {
      const contributors = Object.entries(results)
        .filter(([_, r]) => r.status === aggregateStatus)
        .map(([name]) => name);

      const systemPayload: ISystemStatusEvent = {
        previousStatus: this.previousAggregateStatus,
        newStatus: aggregateStatus,
        timestamp,
        contributors,
      };

      this.emit(HEALTH_EVENTS.SYSTEM_STATUS_CHANGED, systemPayload);
      this.previousAggregateStatus = aggregateStatus;
    }
  }

  /**
   * Emit an event via IPubSubDriver (fire-and-forget, fail-open).
   *
   * @param channel - Event channel name
   * @param data - Event payload
   */
  private emit(channel: string, data: unknown): void {
    if (!this.pubsub) return;

    try {
      const message = {
        event: channel,
        data,
        metadata: { source: '@stackra/nestjs-health', timestamp: new Date() },
      };
      this.pubsub.publish(channel, message).catch(() => {
        // Fail open — never break health check flow
      });
    } catch {
      // Fail open
    }
  }
}
