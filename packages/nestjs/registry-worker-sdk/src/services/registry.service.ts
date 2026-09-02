/**
 * @file registry.service.ts
 * @description Orchestration service that assembles the application manifest and registers it.
 *
 * Implements {@link OnApplicationBootstrap} to ensure registration is submitted after all
 * providers and controllers have been fully initialized. The final manifest is built by
 * merging static feature contributions ({@link REGISTRY_FEATURES}), decorator-discovered
 * records from {@link RegistryDiscoveryService}, and any static overrides from the module options.
 */

import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import type { OnApplicationBootstrap } from "@nestjs/common";
import type { ApplicationManifest, RegistryFeature } from "../interfaces";
import type { RegistryDiscoveryRecord } from "../interfaces/registry-discovery.interface";
import type { RegistryModuleOptions } from "../interfaces/registry-options.interface";
import { REGISTRY_MODULE_OPTIONS, REGISTRY_FEATURES } from "../constants/registry.constants";
import { RegistryDiscoveryService } from "./registry-discovery.service";
import { RegistryClientService, RegistryClientError } from "./registry-client.service";

/**
 * Central registry service injected into host applications.
 *
 * Responsibilities:
 * - On bootstrap: collect discovery records, merge feature contributions, and dispatch registration.
 * - After bootstrap: expose manifest query helpers to other services.
 */
@Injectable()
export class RegistryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RegistryService.name);

  /** Cached manifest built at bootstrap. Null until after onApplicationBootstrap completes. */
  private manifest: ApplicationManifest | null = null;

  constructor(
    @Inject(REGISTRY_MODULE_OPTIONS)
    private readonly options: RegistryModuleOptions,

    private readonly discovery: RegistryDiscoveryService,
    private readonly client: RegistryClientService,

    /** Feature contributions registered via RegistryModule.forFeature(). */
    @Optional()
    @Inject(REGISTRY_FEATURES)
    private readonly features: RegistryFeature[] | null,
  ) {}

  /**
   * Invoked by NestJS after all providers are resolved.
   * Builds and submits the application manifest to the Registry Worker.
   */
  async onApplicationBootstrap(): Promise<void> {
    if (this.options.enabled === false) {
      this.logger.log("Registry auto-registration is disabled. Skipping.");
      return;
    }

    try {
      this.manifest = this.buildManifest();
      const result = await this.client.register(this.manifest);
      this.logger.log(`Registered application "${result.slug}" v${result.version} (id=${result.id}).`);
    } catch (error) {
      if (error instanceof RegistryClientError) {
        this.logger.error(
          `Registration failed [${error.status ?? "network"}]: ${error.message}`,
          error.body,
        );
      } else {
        this.logger.error("Unexpected registration error.", error);
      }

      if (this.options.failOnRegistrationError) {
        throw error;
      }
    }
  }

  /**
   * Returns the application manifest last submitted to the Registry Worker.
   * Returns null if registration has not completed or was disabled.
   */
  getManifest(): ApplicationManifest | null {
    return this.manifest;
  }

  /**
   * Forces an immediate re-registration with the current manifest.
   * Useful after dynamic configuration changes.
   */
  async register(): Promise<void> {
    this.manifest = this.buildManifest();
    await this.client.register(this.manifest);
  }

  // ---------------------------------------------------------------------------
  // Private manifest assembly
  // ---------------------------------------------------------------------------

  /**
   * Assembles the final application manifest from three sources (priority order):
   * 1. Static overrides from module options (highest priority).
   * 2. Feature contributions registered via forFeature().
   * 3. Decorator-discovered records from the Nest DI container.
   */
  private buildManifest(): ApplicationManifest {
    const discovered = this.discovery.collect();
    const merged = this.mergeDiscoveredRecords(discovered);
    const fromFeatures = this.mergeFeatures(this.features ?? []);

    const manifest: ApplicationManifest = {
      slug: this.options.application,
      displayName: this.options.displayName,
      description: this.options.description,
      version: this.options.version,
      branding: this.options.branding,
      metadata: this.options.metadata,
      environments: this.options.environment
        ? [{ environment: this.options.environment }]
        : undefined,

      // Feature contributions first, then discovered metadata.
      modules: [...(fromFeatures.modules ?? []), ...(merged.modules ?? [])],
      resources: [...(fromFeatures.resources ?? []), ...(merged.resources ?? [])],
      actions: [...(fromFeatures.actions ?? []), ...(merged.actions ?? [])],
      navigation: [...(fromFeatures.navigation ?? []), ...(merged.navigation ?? [])],
      capabilities: [
        ...(fromFeatures.capabilities?.map((c) => c.key) ?? []),
        ...(merged.capabilities ?? []),
      ],
      workflowDefinitions: [...(fromFeatures.workflows ?? []), ...(merged.workflowDefinitions ?? [])],
      eventDefinitions: [...(fromFeatures.events ?? []), ...(merged.eventDefinitions ?? [])],
      integrations: [...(fromFeatures.integrations ?? []), ...(merged.integrations ?? [])],
      settings: [...(fromFeatures.settings ?? []), ...(merged.settings ?? [])],
      features: [...(fromFeatures.features ?? []), ...(merged.features ?? [])],
      widgets: [...(fromFeatures.widgets ?? []), ...(merged.widgets ?? [])],
      localization: [...(fromFeatures.localization ?? []), ...(merged.localization ?? [])],
      routes: [...(fromFeatures.routes ?? []), ...(merged.routes ?? [])],

      // Static overrides applied last (highest priority).
      ...this.options.manifestOverrides,
    };

    return manifest;
  }

  /**
   * Reduces a flat array of discovery records into grouped manifest sub-sections.
   */
  private mergeDiscoveredRecords(records: RegistryDiscoveryRecord[]): Partial<ApplicationManifest> {
    const out: Partial<ApplicationManifest> & {
      workflowDefinitions?: ApplicationManifest["workflowDefinitions"];
      eventDefinitions?: ApplicationManifest["eventDefinitions"];
    } = {};

    for (const record of records) {
      switch (record.kind) {
        case "module":
          (out.modules ??= []).push(record.value);
          break;
        case "resource":
          (out.resources ??= []).push(record.value);
          break;
        case "action":
          (out.actions ??= []).push(record.value);
          break;
        case "navigation":
          (out.navigation ??= []).push(record.value);
          break;
        case "capability":
          (out.capabilities ??= []).push(record.value.key);
          break;
        case "workflow":
          (out.workflowDefinitions ??= []).push(record.value);
          break;
        case "event":
          (out.eventDefinitions ??= []).push(record.value);
          break;
        case "integration":
          (out.integrations ??= []).push(record.value);
          break;
        case "setting":
          (out.settings ??= []).push(record.value);
          break;
        case "feature":
          (out.features ??= []).push(record.value);
          break;
        case "widget":
          (out.widgets ??= []).push(record.value);
          break;
        case "localization":
          (out.localization ??= []).push(record.value);
          break;
      }
    }

    return out;
  }

  /**
   * Merges an array of RegistryFeature contributions into a flat manifest shape.
   */
  private mergeFeatures(features: RegistryFeature[]): RegistryFeature {
    const merged: RegistryFeature = {};

    for (const feature of features) {
      if (feature.modules?.length) (merged.modules ??= []).push(...feature.modules);
      if (feature.resources?.length) (merged.resources ??= []).push(...feature.resources);
      if (feature.actions?.length) (merged.actions ??= []).push(...feature.actions);
      if (feature.navigation?.length) (merged.navigation ??= []).push(...feature.navigation);
      if (feature.capabilities?.length) (merged.capabilities ??= []).push(...feature.capabilities);
      if (feature.workflows?.length) (merged.workflows ??= []).push(...feature.workflows);
      if (feature.events?.length) (merged.events ??= []).push(...feature.events);
      if (feature.integrations?.length) (merged.integrations ??= []).push(...feature.integrations);
      if (feature.settings?.length) (merged.settings ??= []).push(...feature.settings);
      if (feature.features?.length) (merged.features ??= []).push(...feature.features);
      if (feature.widgets?.length) (merged.widgets ??= []).push(...feature.widgets);
      if (feature.localization?.length) (merged.localization ??= []).push(...feature.localization);
      if (feature.routes?.length) (merged.routes ??= []).push(...feature.routes);
    }

    return merged;
  }
}
