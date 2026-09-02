/**
 * @file registry-client.service.ts
 * @description Typed HTTP client communicating with the Figentra Application Registry Worker.
 *
 * Utilizes resilient helpers for request formatting, token injection, and retries.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import type {
  IRegistryClientService,
  RegistrationResponse,
  RouteResolutionResult,
  CatalogQueryOptions,
} from "../interfaces/registry-client.interface";
import type { ApplicationManifest } from "../interfaces/registry-manifest.interface";
import type { RegistryModuleOptions } from "../interfaces/registry-options.interface";
import { REGISTRY_MODULE_OPTIONS } from "../constants/registry.constants";
import {
  buildRegistryHeaders,
  buildRegistryUrl,
  fetchWithRetry,
  RegistryClientError,
} from "../helpers/client.helper";

export { RegistryClientError };

/**
 * Client service executing typed HTTP operations against the Registry Worker REST API.
 */
@Injectable()
export class RegistryClientService implements IRegistryClientService {
  private readonly logger = new Logger(RegistryClientService.name);

  constructor(
    @Inject(REGISTRY_MODULE_OPTIONS)
    private readonly options: RegistryModuleOptions,
  ) {}

  /**
   * Submits an application manifest to the Registry Worker registration endpoint.
   *
   * @param manifest - Complete application manifest payload.
   * @returns Registration response containing assigned ID and content hash.
   * @throws RegistryClientError on non-2xx response or network failure.
   */
  async register(manifest: ApplicationManifest): Promise<RegistrationResponse> {
    return this.post<RegistrationResponse>("/v1/registrations", manifest);
  }

  /**
   * Fetches a registered application record by slug.
   *
   * @param slug - Application unique slug.
   */
  async getApplication(slug: string): Promise<Record<string, unknown>> {
    return this.get<Record<string, unknown>>(
      `/v1/applications/${encodeURIComponent(slug)}`,
    );
  }

  /**
   * Fetches aggregated capability, module, resource, and navigation metadata.
   *
   * @param slug - Application unique slug.
   */
  async getApplicationMetadata(slug: string): Promise<Record<string, unknown>> {
    return this.get<Record<string, unknown>>(
      `/v1/applications/${encodeURIComponent(slug)}/metadata`,
    );
  }

  /**
   * Resolves an upstream microservice target and expected audience for method + path.
   *
   * @param method - HTTP request method (e.g. GET, POST).
   * @param path - Incoming request path.
   */
  async resolveRoute(
    method: string,
    path: string,
  ): Promise<RouteResolutionResult> {
    const qs = new URLSearchParams({ method: method.toUpperCase(), path });
    return this.get<RouteResolutionResult>(`/v1/routes/resolve?${qs}`);
  }

  /**
   * Queries catalog items within a specific category.
   *
   * @param category - Category name (workflow, event, integration, setting, feature, widget, localization).
   * @param options - Optional query filters and pagination.
   */
  async getCatalog(
    category:
      | "workflow"
      | "event"
      | "integration"
      | "setting"
      | "feature"
      | "widget"
      | "localization",
    options: CatalogQueryOptions = {},
  ): Promise<Record<string, unknown>[]> {
    const qs = new URLSearchParams();
    if (options.application) qs.set("application", options.application);
    if (options.limit !== undefined) qs.set("limit", String(options.limit));
    if (options.offset !== undefined) qs.set("offset", String(options.offset));
    const query = qs.toString();
    return this.get<Record<string, unknown>[]>(
      `/v1/catalog/${category}${query ? `?${query}` : ""}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Internal HTTP execution delegating to client.helper
  // ---------------------------------------------------------------------------

  private async get<T>(path: string): Promise<T> {
    const url = buildRegistryUrl(this.options.registryUrl, path);
    const headers = buildRegistryHeaders(this.options.registrationToken);

    const response = await fetchWithRetry(
      url,
      { method: "GET", headers },
      this.options.registrationRetries,
      this.options.registrationTimeoutMs,
      this.logger,
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new RegistryClientError(
        `GET ${path} failed with ${response.status}`,
        response.status,
        body,
      );
    }

    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = buildRegistryUrl(this.options.registryUrl, path);
    const headers = buildRegistryHeaders(this.options.registrationToken);

    const response = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
      this.options.registrationRetries,
      this.options.registrationTimeoutMs,
      this.logger,
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new RegistryClientError(
        `POST ${path} failed with ${response.status}`,
        response.status,
        errorBody,
      );
    }

    return response.json() as Promise<T>;
  }
}
