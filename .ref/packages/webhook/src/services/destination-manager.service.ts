/**
 * @file destination-manager.service.ts
 * @module @stackra/nestjs-webhook/services
 * @description Manages webhook delivery destinations (HTTPS, EventBridge, PubSub, SQS).
 *   Extends MultipleInstanceManager for lazy creation, caching, and extensibility.
 *   Custom drivers are registered via `WebhookModule.forFeature()` or `extend()`.
 */

import { IInjectable, Inject } from '@nestjs/common';
import { MultipleInstanceManager } from '@stackra/ts-support';

import { WEBHOOK_CONFIG } from '../constants';
import type { IWebhookConfig, IWebhookDestination } from '../interfaces';

// ============================================================================
// Service
// ============================================================================

/**
 * Multi-driver destination manager for webhook delivery transports.
 *
 * Extends `MultipleInstanceManager` to provide named destination drivers.
 * The built-in 'https' driver is the default. Custom drivers (EventBridge,
 * PubSub, SQS) can be registered via `WebhookModule.forFeature()` which
 * calls `extend()`, or via `registerDestination()` during module init.
 *
 * @example
 * ```typescript
 * // Get the default HTTPS destination
 * const dest = destinationManager.instance(); // HttpsDestination
 *
 * // Get a custom destination
 * const eventBridge = destinationManager.instance('eventbridge');
 *
 * // Register a destination config during module init
 * destinationManager.registerDestination('sqs', { region: 'us-east-1' });
 * ```
 */
@IInjectable()
export class DestinationManager extends MultipleInstanceManager<IWebhookDestination> {
  /** The default destination driver name. */
  private defaultName = 'https';

  /** Per-destination configuration store. */
  private readonly configs: Map<string, Record<string, any>> = new Map();

  /**
   * @param config - Global webhook configuration.
   */
  public constructor(
    @Inject(WEBHOOK_CONFIG)
    private readonly config: IWebhookConfig
  ) {
    super();
  }

  // ── Abstract implementations ──────────────────────────────────────────

  /**
   * Get the default destination driver name.
   *
   * @returns The default driver name.
   */
  public getDefaultInstance(): string {
    return this.defaultName;
  }

  /**
   * Set the default destination driver name at runtime.
   *
   * @param name - The new default driver name.
   */
  public setDefaultInstance(name: string): void {
    this.defaultName = name;
  }

  /**
   * Get configuration for a named destination instance.
   *
   * Returns the config registered via `registerDestination()`, or a
   * minimal config with just the driver name if none was registered.
   *
   * @param name - The destination driver name.
   * @returns Configuration record for the driver, or undefined if not registered.
   */
  public getInstanceConfig(name: string): Record<string, any> | undefined {
    return this.configs.get(name);
  }

  /**
   * Create a destination driver instance by name.
   *
   * This method throws by design — all drivers must be registered via
   * `extend()` or `WebhookModule.forFeature()`. The built-in 'https'
   * driver is registered during module initialization.
   *
   * @param driver - The driver name to create.
   * @param _config - Configuration for the driver.
   * @returns Never — always throws.
   * @throws Error indicating the driver is not registered.
   */
  protected createDriver(driver: string, _config: Record<string, any>): IWebhookDestination {
    throw new Error(
      `Webhook destination driver "${driver}" is not registered. ` +
        `Use WebhookModule.forFeature() or destinationManager.extend() to register it.`
    );
  }

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Register a destination's configuration.
   *
   * Called during module initialization to make a destination available
   * for lazy creation via `instance()`.
   *
   * @param name - The destination driver name.
   * @param config - Driver-specific configuration options.
   */
  public registerDestination(name: string, config: Record<string, any> = {}): void {
    this.configs.set(name, { driver: name, ...config });
  }
}
