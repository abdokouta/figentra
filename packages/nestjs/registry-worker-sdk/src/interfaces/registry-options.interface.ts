/**
 * @file registry-options.interface.ts
 * @description Configuration contracts for RegistryModule.forRoot() and forRootAsync().
 */

import type { ModuleMetadata, Type } from "@nestjs/common";
import type { ApplicationManifest } from "./registry-manifest.interface";

/** Synchronous configuration options for RegistryModule.forRoot(). */
export interface RegistryModuleOptions {
  /**
   * Slug of this application as registered in the Registry Worker.
   * Must be unique across all Figentra applications.
   */
  application: string;

  /**
   * Display name of this application shown in dashboards and catalogs.
   */
  displayName: string;

  /**
   * Human-readable description of this application's purpose.
   */
  description?: string;

  /**
   * Semantic version of this application deployment.
   */
  version: string;

  /**
   * Base URL of the Registry Worker (e.g. https://registry.figentra.workers.dev).
   */
  registryUrl: string;

  /**
   * JWT Bearer token with registry:application:register permission for
   * dispatching registration payloads.
   */
  registrationToken?: string;

  /**
   * Target deployment environment.
   * @default "development"
   */
  environment?: "development" | "staging" | "production";

  /**
   * Branding metadata (icon, colors, etc.) included in the registration payload.
   */
  branding?: Record<string, unknown>;

  /**
   * Extra metadata included verbatim in the registration payload.
   */
  metadata?: Record<string, unknown>;

  /**
   * Whether to auto-register on application bootstrap.
   * @default true
   */
  enabled?: boolean;

  /**
   * Abort application startup if registration fails.
   * @default false
   */
  failOnRegistrationError?: boolean;

  /**
   * Timeout for the registration HTTP request in milliseconds.
   * @default 10000
   */
  registrationTimeoutMs?: number;

  /**
   * Maximum number of registration retries before giving up.
   * @default 3
   */
  registrationRetries?: number;

  /**
   * Static manifest overrides applied to the auto-discovered manifest before submission.
   */
  manifestOverrides?: Partial<ApplicationManifest>;
}

/** Factory function provider for async configuration. */
export interface RegistryOptionsFactory {
  createRegistryOptions(): Promise<RegistryModuleOptions> | RegistryModuleOptions;
}

/** Async configuration options for RegistryModule.forRootAsync(). */
export interface RegistryModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  useFactory?: (...args: unknown[]) => Promise<RegistryModuleOptions> | RegistryModuleOptions;
  useClass?: Type<RegistryOptionsFactory>;
  useExisting?: Type<RegistryOptionsFactory>;
  inject?: Array<string | symbol | Type<unknown>>;
}
