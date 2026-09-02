/**
 * @file registry-client.interface.ts
 * @description HTTP client contract for communicating with the Figentra Registry Worker.
 */

import type { ApplicationManifest } from "./registry-manifest.interface";

/** Response returned by the Registry Worker when a registration succeeds. */
export interface RegistrationResponse {
  id: string;
  slug: string;
  version: string;
  contentHash: string;
}

/** Parameters for querying catalog items. */
export interface CatalogQueryOptions {
  /** Filter catalog items to a specific application slug. */
  application?: string;
  /** Pagination limit. */
  limit?: number;
  /** Pagination offset. */
  offset?: number;
}

/** Resolved upstream target returned by the route resolution endpoint. */
export interface RouteResolutionResult {
  id?: string;
  slug?: string;
  upstream: string;
  audience: string;
  requiredPermission?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Contract for the Registry HTTP client.
 * Implementations are expected to handle JWT signing, retries, and caching transparently.
 */
export interface IRegistryClientService {
  /**
   * Submits an application manifest to the Registry Worker.
   * @param manifest - Complete application manifest payload.
   */
  register(manifest: ApplicationManifest): Promise<RegistrationResponse>;

  /**
   * Fetches application record by slug.
   * @param slug - Application slug.
   */
  getApplication(slug: string): Promise<Record<string, unknown>>;

  /**
   * Fetches aggregated metadata (modules, resources, actions, navigation, etc.) for an application.
   * @param slug - Application slug.
   */
  getApplicationMetadata(slug: string): Promise<Record<string, unknown>>;

  /**
   * Resolves an upstream target route from method + path pattern.
   * Used by the Gateway service to perform request routing.
   *
   * @param method - HTTP method (GET, POST, etc.).
   * @param path - Request path to resolve.
   */
  resolveRoute(method: string, path: string): Promise<RouteResolutionResult>;

  /**
   * Queries catalog items in a given category.
   * @param category - Catalog category (e.g. workflow, event, integration).
   * @param options - Optional query parameters.
   */
  getCatalog(
    category: "workflow" | "event" | "integration" | "setting" | "feature" | "widget" | "localization",
    options?: CatalogQueryOptions,
  ): Promise<Record<string, unknown>[]>;
}
