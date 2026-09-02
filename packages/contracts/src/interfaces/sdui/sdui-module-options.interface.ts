/**
 * @file sdui-module-options.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Consumer configuration for `SduiModule.forRoot(...)`.
 */

import type {
  ISduiComponentEntry,
  ISduiLayoutEntry,
} from "./sdui-registry.interface";

/**
 * Configuration options for the SDUI module.
 */
export interface ISduiModuleOptions {
  /** Base URL for schema fetches. */
  readonly baseUrl?: string;

  /**
   * Cache TTL for fetched screens, in seconds. Defaults to one hour.
   * Set `0` to disable caching entirely.
   */
  readonly cacheTtl?: number;

  /**
   * When `true`, the renderer runs the screen validator against every
   * loaded screen. Defaults to `false` in production.
   */
  readonly validateSchemas?: boolean;

  /**
   * Additional components registered at boot alongside the core seed
   * (Box/Stack/Grid/Section/Text/Heading/Icon + HeroUI compounds).
   */
  readonly components?: Readonly<Record<string, ISduiComponentEntry>>;

  /** Additional layout templates registered at boot. */
  readonly layouts?: readonly ISduiLayoutEntry[];

  /**
   * When `true`, `SDUI_CLIENT` binds to the HTTP-backed
   * `HttpSduiClient` (per-screen fetches) AND
   * `SDUI_RESOURCE_CATALOG_CLIENT` binds to `HttpResourceCatalogClient`
   * (resource catalogue fetches from the backend's
   * `stackra/sdui` platform-schema endpoint).
   *
   * Requires an `HttpModule.forRoot(...)` in the app's module tree
   * declaring a connection named per `connectionName`.
   */
  readonly useHttpClient?: boolean;

  /**
   * Named HTTP connection the sdui clients read. Defaults to `"sdui"`.
   * Ignored when `useHttpClient !== true`.
   */
  readonly connectionName?: string;

  /**
   * Absolute API path for the platform-admin resource catalogue.
   * Defaults to `/api/v1/platform/schema`. Consumed only by
   * `HttpResourceCatalogClient` when `useHttpClient: true`.
   */
  readonly platformSchemaEndpoint?: string;

  /**
   * Path suffix appended to every per-screen URL fetched via
   * `HttpSduiClient.loadScreen(path)`. Defaults to `""`. Static-file
   * dev-server setups (Vite serving `public/screens/**.json`) flip
   * this to `".json"`. Ignored when the consumer supplies their own
   * `client:` instance.
   */
  readonly pathSuffix?: string;
}
