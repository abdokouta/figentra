/**
 * @file link-builder.service.ts
 * @module @stackra/nestjs-response/core/hateoas
 * @description Service for building HATEOAS links in API responses.
 *   Generates standard link URLs for self-references, resources, collections, and actions.
 */

import { IInjectable } from '@nestjs/common';

/**
 * Builds HATEOAS links for hypermedia-driven API responses.
 *
 * Generates consistent URL patterns for resource navigation,
 * enabling clients to discover related resources and available actions
 * without hardcoding URL structures.
 */
@IInjectable()
export class HateoasLinkBuilder {
  /**
   * Generate a self-referencing link from the current request.
   *
   * @param request - The incoming HTTP request object
   * @returns The full URL of the current request
   */
  public self(request: {
    protocol: string;
    get: (name: string) => string | undefined;
    originalUrl: string;
  }): string {
    const host = request.get('host') ?? 'localhost';
    return `${request.protocol}://${host}${request.originalUrl}`;
  }

  /**
   * Generate a link to a specific resource by type and ID.
   *
   * @param type - The resource type (pluralized, e.g., 'users')
   * @param id - The resource identifier
   * @returns The resource URL path
   */
  public resource(type: string, id: string): string {
    return `/api/${type}/${id}`;
  }

  /**
   * Generate a link to a resource collection with optional query parameters.
   *
   * @param type - The resource type (pluralized, e.g., 'users')
   * @param params - Optional query parameters to append
   * @returns The collection URL path with query string
   */
  public collection(type: string, params?: Record<string, string>): string {
    const base = `/api/${type}`;

    if (!params || Object.keys(params).length === 0) {
      return base;
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${base}?${queryString}`;
  }

  /**
   * Generate a link to a resource action endpoint.
   *
   * @param type - The resource type (pluralized, e.g., 'users')
   * @param id - The resource identifier
   * @param action - The action name (e.g., 'activate', 'archive')
   * @returns The action URL path
   */
  public action(type: string, id: string, action: string): string {
    return `/api/${type}/${id}/${action}`;
  }
}
