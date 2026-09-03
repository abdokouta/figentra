/**
 * @file http-method.enum.ts
 * @module @stackra/contracts/enums
 * @description Standard HTTP method enum used by routing, HTTP client,
 *   and API contract definitions.
 */

/**
 * Standard HTTP methods. Used by `@stackra/http`, `@stackra/routing`,
 * and service-boundary contracts.
 */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}
