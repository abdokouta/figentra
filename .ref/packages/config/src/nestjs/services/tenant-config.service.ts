/**
 * @file tenant-config.service.ts
 * @module @stackra/config/nestjs/services
 * @description Tenant-scoped configuration service.
 *   Resolves config values scoped to the current request's tenant,
 *   merging tenant overrides > plan defaults > global config.
 */

import { IInjectable, Inject, Optional, IScope } from '@nestjs/common';

import { CONFIG_MANAGER, TENANT_CONFIG_REPOSITORY } from '@stackra/contracts';
import type { ITenantConfigRepository } from '@stackra/contracts';
import type { ConfigManager } from '../../core/services/config-manager.service';

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Tenant-scoped config service.
 *
 * Resolves configuration values by merging:
 * 1. Tenant-specific overrides (highest priority)
 * 2. Plan-level defaults
 * 3. Global config (lowest priority)
 *
 * Request-scoped: a new instance per HTTP request to isolate tenant context.
 *
 * @example
 * ```typescript
 * @IInjectable()
 * class InvoiceService {
 *   constructor(private readonly tenantConfig: TenantConfigService) {}
 *
 *   async getInvoicePrefix() {
 *     return this.tenantConfig.get('invoice.prefix', 'INV-');
 *   }
 * }
 * ```
 */
@IInjectable({ scope: IScope.REQUEST })
export class TenantConfigService {
  /** Cached merged tenant config for this request. */
  private mergedConfig: Record<string, unknown> | null = null;

  /**
   * @param configManager - Global config manager
   * @param tenantConfigRepo - Repository for loading tenant overrides (optional)
   */
  public constructor(
    @Inject(CONFIG_MANAGER) private readonly configManager: ConfigManager,
    @Optional()
    @Inject(TENANT_CONFIG_REPOSITORY)
    private readonly tenantConfigRepo?: ITenantConfigRepository
  ) {}

  /**
   * Get a tenant-scoped config value.
   *
   * @typeParam T - Expected return type
   * @param key - Config key (dot notation)
   * @param defaultValue - Fallback value
   * @param ownerId - Tenant ID (resolved from request context if not provided)
   * @param planId - Plan ID for plan-level defaults
   * @returns The resolved value
   */
  public async get<T = unknown>(
    key: string,
    defaultValue?: T,
    ownerId?: string,
    planId?: string
  ): Promise<T | undefined> {
    if (!this.tenantConfigRepo || !ownerId) {
      // No tenant context — fall through to global config
      const globalConfig = this.configManager.source();
      return globalConfig.get<T>(key, defaultValue);
    }

    const merged = await this.getMergedConfig(ownerId, planId);
    const value = this.getNestedValue(merged, key);
    return (value !== undefined ? value : defaultValue) as T | undefined;
  }

  /**
   * Check if a tenant-scoped config key exists.
   *
   * @param key - Config key
   * @param ownerId - Tenant ID
   * @param planId - Plan ID
   * @returns True if the key exists in any layer
   */
  public async has(key: string, ownerId?: string, planId?: string): Promise<boolean> {
    const value = await this.get(key, undefined, ownerId, planId);
    return value !== undefined;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get or build the merged config for the current tenant+plan.
   */
  private async getMergedConfig(
    ownerId: string,
    planId?: string
  ): Promise<Record<string, unknown>> {
    if (this.mergedConfig) return this.mergedConfig;

    const globalConfig = this.configManager.source().all();
    let planDefaults: Record<string, unknown> = {};
    let tenantOverrides: Record<string, unknown> = {};

    if (this.tenantConfigRepo) {
      if (planId) {
        planDefaults = await this.tenantConfigRepo.getPlanDefaults(planId);
      }
      tenantOverrides = await this.tenantConfigRepo.getOverrides(ownerId);
    }

    // Merge: global < plan defaults < tenant overrides
    this.mergedConfig = {
      ...globalConfig,
      ...planDefaults,
      ...tenantOverrides,
    };

    return this.mergedConfig;
  }

  /**
   * Resolve a dot-notation key in an object.
   */
  private getNestedValue(obj: Record<string, unknown>, key: string): unknown {
    const parts = key.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}
