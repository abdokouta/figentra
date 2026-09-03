/**
 * @file webhook-signer.service.ts
 * @module @stackra/nestjs-webhook/services
 * @description Service for computing HMAC signatures for outbound webhook payloads.
 *   Supports dual-signature emission during secret rotation grace windows,
 *   ensuring receivers can validate against either the current or previous secret.
 */

import { IInjectable, Inject } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { WEBHOOK_CONFIG } from '../constants';
import type { IWebhookConfig } from '../interfaces';

// ============================================================================
// Service
// ============================================================================

/**
 * Computes HMAC signatures for outbound webhook payloads.
 *
 * The signature scheme signs `${timestamp}.${payload}` to prevent replay
 * attacks. During secret rotation, both old and new signatures are included
 * so receivers can transition without downtime.
 *
 * @example
 * ```typescript
 * const sig = signer.sign(payload, secret, 'sha256', timestamp);
 * const headers = signer.buildHeaders(
 *   deliveryId, eventName, 1, payload, subscription, config
 * );
 * ```
 */
@IInjectable()
export class WebhookSigner {
  /**
   * @param config - Global webhook configuration providing header names and rotation settings.
   */
  public constructor(
    @Inject(WEBHOOK_CONFIG)
    private readonly config: IWebhookConfig
  ) {}

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Compute an HMAC signature for a webhook payload.
   *
   * Signs the string `${timestamp}.${payload}` using the specified algorithm
   * and secret, returning the hex-encoded digest.
   *
   * @param payload - The JSON-stringified payload body.
   * @param secret - The HMAC secret key.
   * @param algorithm - The hash algorithm (e.g., 'sha256').
   * @param timestamp - Unix timestamp in seconds.
   * @returns The hex-encoded HMAC signature.
   *
   * @example
   * ```typescript
   * const signature = signer.sign('{"order":"123"}', 'whsec_abc', 'sha256', 1700000000);
   * ```
   */
  public sign(payload: string, secret: string, algorithm: string, timestamp: number): string {
    const signedContent = `${timestamp}.${payload}`;
    return createHmac(algorithm, secret).update(signedContent).digest('hex');
  }

  /**
   * Build all webhook delivery headers including signatures.
   *
   * Includes the standard headers (ID, event, timestamp, signature, attempt)
   * and optionally the previous signature during secret rotation grace window.
   *
   * @param deliveryId - Unique delivery identifier (UUID).
   * @param eventName - Wire-format event name.
   * @param attempt - Current attempt number (1-based).
   * @param payload - The JSON-stringified payload body.
   * @param subscription - Subscription data containing secret and rotation info.
   * @param subscription.secret - The current HMAC secret.
   * @param subscription.signature_algorithm - The hash algorithm.
   * @param subscription.secret_previous - The previous secret (during rotation).
   * @param subscription.secret_rotated_at - When the secret was rotated.
   * @returns Record of header name → value pairs for the delivery request.
   *
   * @example
   * ```typescript
   * const headers = signer.buildHeaders('uuid-123', 'order.created', 1, payload, {
   *   secret: 'whsec_current',
   *   signature_algorithm: 'sha256',
   *   secret_previous: 'whsec_old',
   *   secret_rotated_at: new Date('2024-01-01'),
   * });
   * ```
   */
  public buildHeaders(
    deliveryId: string,
    eventName: string,
    attempt: number,
    payload: string,
    subscription: {
      secret: string;
      signature_algorithm: string;
      secret_previous?: string | null;
      secret_rotated_at?: Date | null;
    }
  ): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.sign(
      payload,
      subscription.secret,
      subscription.signature_algorithm,
      timestamp
    );

    const headers: Record<string, string> = {
      [this.config.signing.header_id]: deliveryId,
      [this.config.signing.header_event]: eventName,
      [this.config.signing.header_timestamp]: String(timestamp),
      [this.config.signing.header_signature]: signature,
      [this.config.signing.header_attempt]: String(attempt),
    };

    // Include previous signature during rotation grace window
    if (subscription.secret_previous && subscription.secret_rotated_at) {
      const graceExpiry =
        subscription.secret_rotated_at.getTime() +
        this.config.signing.rotation_grace_seconds * 1000;

      if (Date.now() < graceExpiry) {
        headers[this.config.signing.header_signature_previous] = this.sign(
          payload,
          subscription.secret_previous,
          subscription.signature_algorithm,
          timestamp
        );
      }
    }

    return headers;
  }
}
