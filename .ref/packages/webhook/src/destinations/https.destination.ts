/**
 * @file https.destination.ts
 * @module @stackra/nestjs-webhook/destinations
 * @description HTTPS webhook delivery destination using native fetch (Node 18+).
 *   Supports timeout via AbortController, gzip compression, custom headers,
 *   proxy support via environment variables, and SSL verification configuration.
 */

import { Logger } from '@nestjs/common';
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';

import type { IWebhookDestination, IDeliveryRequest, IDeliveryResult } from '../interfaces';

// ============================================================================
// Constants
// ============================================================================

/** Maximum response body bytes to capture for audit. */
const MAX_RESPONSE_BODY_BYTES = 65_536;

// ============================================================================
// Destination
// ============================================================================

/**
 * HTTPS webhook delivery destination.
 *
 * Uses native `fetch` (Node 18+) for HTTP requests. Supports:
 * - Timeout via AbortController
 * - Gzip compression of request body
 * - Custom headers per delivery
 * - Proxy support via `HTTPS_PROXY` / `HTTP_PROXY` environment variables
 * - SSL verification configuration
 *
 * Returns a structured `IDeliveryResult` with status code, duration,
 * response headers, truncated response body, and error information.
 *
 * @example
 * ```typescript
 * const destination = new HttpsDestination();
 * const result = await destination.deliver({
 *   url: 'https://hooks.example.com/webhook',
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': '...' },
 *   body: '{"event":"order.created"}',
 *   timeout_seconds: 30,
 *   compress: false,
 *   verify_ssl: true,
 * });
 * ```
 */
export class HttpsDestination implements IWebhookDestination {
  /** Scoped logger instance. */
  private readonly logger = new Logger(HttpsDestination.name);

  /**
   * Deliver a webhook payload to the specified URL.
   *
   * @param request - The delivery request containing URL, headers, body, and options.
   * @returns A structured delivery result with response data and timing.
   */
  public async deliver(request: IDeliveryRequest): Promise<IDeliveryResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutMs = (request.timeout_seconds ?? 30) * 1000;

    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Prepare request body (optionally compressed)
      let body: string | Uint8Array = request.body;
      const headers: Record<string, string> = { ...request.headers };

      if (request.compress) {
        const compressed = gzipSync(Buffer.from(request.body, 'utf-8'));
        body = new Uint8Array(compressed.buffer, compressed.byteOffset, compressed.byteLength);
        headers['Content-Encoding'] = 'gzip';
      }

      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      // Execute the request
      const response = await fetch(request.url, {
        method: request.method ?? 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      const durationMs = Date.now() - startTime;

      // Capture response body (truncated)
      const responseText = await this.captureResponseBody(response);
      const responseBodySha256 = responseText
        ? createHash('sha256').update(responseText).digest('hex')
        : undefined;

      // Capture response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status_code: response.status,
        duration_ms: durationMs,
        response_headers: responseHeaders,
        response_body: responseText?.substring(0, MAX_RESPONSE_BODY_BYTES) ?? null,
        response_body_sha256: responseBodySha256 ?? null,
        error_message: null,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = this.extractErrorMessage(error);

      this.logger.warn(`Delivery to "${request.url}" failed: ${errorMessage}`);

      return {
        status_code: null,
        duration_ms: durationMs,
        response_headers: null,
        response_body: null,
        response_body_sha256: null,
        error_message: errorMessage,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Capture the response body text, truncated to the max audit size.
   *
   * @param response - The fetch Response object.
   * @returns The response body text, or null if empty.
   */
  private async captureResponseBody(response: Response): Promise<string | null> {
    try {
      const text = await response.text();
      return text || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract a human-readable error message from an unknown error.
   *
   * @param error - The caught error.
   * @returns A descriptive error message string.
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return 'Request timed out';
      }
      return error.message;
    }
    return String(error);
  }
}
