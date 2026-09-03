/**
 * @file indicator.registry.ts
 * @module @stackra/nestjs-health/registries
 * @description Singleton registry managing all discovered and registered health indicators.
 */

import { IInjectable, Logger } from '@nestjs/common';
import { BaseRegistry } from '@stackra/ts-support';
import type { HealthProbe } from '@stackra/contracts';
import type { IIndicatorRegistration } from '../interfaces';

/**
 * Singleton registry for health indicators.
 *
 * Extends `BaseRegistry<string, IIndicatorRegistration>` where the key is
 * the indicator name.
 *
 * Populated by:
 * 1. IndicatorLoaderService (auto-discovery at bootstrap)
 * 2. NestHealthModule.forFeature() (manual registration)
 *
 * Queried by:
 * - HealthRunner (to determine which indicators run per probe)
 * - HealthController (admin API: list indicators)
 */
@IInjectable()
export class IndicatorRegistry extends BaseRegistry<string, IIndicatorRegistration> {
  private readonly logger = new Logger(IndicatorRegistry.name);
  private readonly pausedIndicators = new Set<string>();

  /**
   * Register an indicator in the registry.
   *
   * Accepts either a single `IIndicatorRegistration` object (using `entry.name`
   * as the key) or the two-argument `(key, value)` form from `BaseRegistry`.
   *
   * If a duplicate name is found, logs a warning and replaces the existing entry.
   *
   * @param keyOrEntry - The indicator name (string) or full registration object
   * @param value - The registration object (when using two-argument form)
   * @returns this (for chaining)
   */
  public override register(
    keyOrEntry: string | IIndicatorRegistration,
    value?: IIndicatorRegistration
  ): this {
    const entry: IIndicatorRegistration = typeof keyOrEntry === 'string' ? value! : keyOrEntry;
    const name = typeof keyOrEntry === 'string' ? keyOrEntry : keyOrEntry.name;

    if (this.has(name)) {
      this.logger.warn(
        `Duplicate health indicator name "${name}" — replacing previous registration.`
      );
    }
    return super.register(name, entry);
  }

  /**
   * Get all registered indicators.
   *
   * @returns Array of all indicator registrations
   */
  public getAll(): IIndicatorRegistration[] {
    return this.values();
  }

  /**
   * Get indicators assigned to a specific probe.
   *
   * @param probe - The probe to filter by
   * @returns Array of indicators assigned to the given probe
   */
  public getByProbe(probe: HealthProbe): IIndicatorRegistration[] {
    return this.getAll().filter((entry) => entry.probes.includes(probe));
  }

  /**
   * Get a single indicator by name.
   *
   * @param name - The indicator name to look up
   * @returns The registration entry, or undefined if not found
   */
  public getByName(name: string): IIndicatorRegistration | undefined {
    return this.get(name);
  }

  /**
   * Pause a specific indicator (it will be skipped during checks).
   *
   * @param name - The indicator name to pause
   */
  public pause(name: string): void {
    this.pausedIndicators.add(name);
  }

  /**
   * Resume a previously paused indicator.
   *
   * @param name - The indicator name to resume
   */
  public resume(name: string): void {
    this.pausedIndicators.delete(name);
  }

  /**
   * Check if an indicator is currently paused.
   *
   * @param name - The indicator name to check
   * @returns Whether the indicator is paused
   */
  public isPaused(name: string): boolean {
    return this.pausedIndicators.has(name);
  }

  /**
   * Get the count of registered indicators.
   *
   * @returns Total number of registered indicators
   */
  public get size(): number {
    return this.count();
  }
}
