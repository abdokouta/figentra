/**
 * @file cooldown-tracker.service.ts
 * @module @stackra/nestjs-health/services
 * @description Tracks notification cooldowns per indicator to prevent alert storms.
 *
 * @todo Replace with `@stackra/ts-cache` memory store once available.
 *   The cache package can provide TTL-based expiration natively, eliminating
 *   the manual timestamp comparison. Use `cache.remember(key, ttl, factory)`.
 */

import { IInjectable } from '@nestjs/common';
import { DEFAULT_COOLDOWN_SECONDS } from '../constants';

/**
 * Tracks event emission cooldowns per indicator.
 *
 * Prevents alert storms by suppressing repeated `health.indicator.down` events
 * within the configured cooldown period. Recovery events are never suppressed.
 */
@IInjectable()
export class CooldownTrackerService {
  private readonly lastEmission = new Map<string, number>();
  private cooldownMs: number;

  public constructor() {
    this.cooldownMs = DEFAULT_COOLDOWN_SECONDS * 1000;
  }

  /**
   * Set the cooldown period.
   *
   * @param seconds - Cooldown in seconds
   */
  public setCooldown(seconds: number): void {
    this.cooldownMs = seconds * 1000;
  }

  /**
   * Check if a down event can be emitted for an indicator.
   *
   * Returns true if no previous emission exists or the cooldown has elapsed.
   *
   * @param indicatorName - The indicator to check
   * @returns Whether the event should be emitted
   */
  public shouldEmitDown(indicatorName: string): boolean {
    const lastTime = this.lastEmission.get(indicatorName);
    if (lastTime === undefined) {
      return true;
    }
    return Date.now() - lastTime >= this.cooldownMs;
  }

  /**
   * Record that a down event was emitted for an indicator.
   *
   * @param indicatorName - The indicator that emitted
   */
  public recordDownEmission(indicatorName: string): void {
    this.lastEmission.set(indicatorName, Date.now());
  }

  /**
   * Clear the cooldown for an indicator (e.g., on recovery).
   *
   * After clearing, the next down event will always be emitted.
   *
   * @param indicatorName - The indicator to clear
   */
  public clear(indicatorName: string): void {
    this.lastEmission.delete(indicatorName);
  }
}
