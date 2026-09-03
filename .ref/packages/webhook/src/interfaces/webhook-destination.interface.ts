/**
 * @file webhook-destination.interface.ts
 * @module @stackra/nestjs-webhook/interfaces
 * @description Interfaces for webhook delivery destinations and their results.
 *   Defines the contract that all destination drivers must implement.
 */

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Request data passed to a destination driver for delivery.
 */
export interface IDeliveryRequest {
  /** The target URL for delivery. */
  url: string;

  /** HTTP method (e.g., 'POST', 'PUT'). */
  method: string;

  /** Request headers including signatures. */
  headers: Record<string, string>;

  /** JSON-stringified payload body. */
  body: string;

  /** Request timeout in seconds. */
  timeout_seconds: number;

  /** Whether to gzip-compress the body. */
  compress: boolean;

  /** Whether to verify SSL certificates. */
  verify_ssl: boolean;

  /** Per-subscription destination configuration (driver-specific). */
  destination_config?: Record<string, any>;
}

/**
 * Result returned by a destination driver after a delivery attempt.
 */
export interface IDeliveryResult {
  /** HTTP status code (null if network error). */
  status_code: number | null;

  /** Request duration in milliseconds. */
  duration_ms: number;

  /** Response headers (null if network error). */
  response_headers: Record<string, string> | null;

  /** Truncated response body (null if empty or network error). */
  response_body: string | null;

  /** SHA-256 hash of the full response body (null if empty). */
  response_body_sha256: string | null;

  /** Error message (null if no error). */
  error_message: string | null;
}

/**
 * Contract for webhook delivery destination drivers.
 *
 * Implementations handle the actual transport of webhook payloads to
 * their target. The built-in `HttpsDestination` uses native fetch;
 * custom drivers can target EventBridge, PubSub, SQS, etc.
 */
export interface IWebhookDestination {
  /**
   * Deliver a webhook payload to the target.
   *
   * @param request - The delivery request with URL, headers, body, and options.
   * @returns A structured result with status, timing, and response data.
   */
  deliver(request: IDeliveryRequest): Promise<IDeliveryResult>;
}
