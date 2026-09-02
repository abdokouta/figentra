/**
 * @file gateway.constant.ts
 * @description Canonical Gateway protocol constants.
 */

/** Stable Gateway service identifier. */
export const GATEWAY_SERVICE_NAME = "gateway";
/** Public API prefix. */
export const GATEWAY_API_PREFIX = "api";
/** Public API version. */
export const GATEWAY_API_VERSION = "1";
/** Request identifier header. */
export const REQUEST_ID_HEADER = "x-request-id";
/** Correlation identifier header. */
export const CORRELATION_ID_HEADER = "x-correlation-id";
/** W3C trace context header. */
export const TRACEPARENT_HEADER = "traceparent";
/** Actor context header is response/internal only and never trusted inbound. */
export const ACTOR_CONTEXT_HEADER = "x-figentra-actor-context";
/** Downstream authenticated authorization header. */
export const AUTHORIZATION_HEADER = "authorization";
/** Gateway route service parameter. */
export const SERVICE_ROUTE_PARAMETER = "service";
/** Maximum accepted request body size. */
export const MAX_BODY_BYTES = 2 * 1024 * 1024;
/** Default upstream timeout. */
export const UPSTREAM_TIMEOUT_MS = 10_000;
/** Maximum safe retries for idempotent upstream calls. */
export const UPSTREAM_MAX_RETRIES = 1;
/** Health routes intentionally bypass user authentication. */
export const PUBLIC_PATHS = Object.freeze(["/api/health/live", "/api/health/ready"] as const);

/** Environment names used by the Gateway. */
export const ENVIRONMENT_NAMES = Object.freeze(["development", "staging", "production"] as const);
