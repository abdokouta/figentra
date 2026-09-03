/**
 * Update webhook subscription DTO.
 *
 * Input shape for updating an existing webhook subscription.
 * All fields except `id` are optional — only provided fields
 * are updated.
 *
 * @module @stackra/nestjs-webhook/dto/update-subscription
 */

/**
 * Data transfer object for updating a webhook subscription.
 */
export class UpdateSubscriptionDto {
  /** ID of the subscription to update. */
  public id!: string;

  /** Human-readable subscription name. */
  public name?: string;

  /** Target URL for webhook deliveries. */
  public url?: string;

  /** Array of event names this subscription listens for. */
  public events?: string[];

  /** Optional description of the subscription's purpose. */
  public description?: string | null;

  /** HTTP method for deliveries. */
  public http_verb?: string;

  /** Custom HTTP headers to include in delivery requests. */
  public headers?: Record<string, string> | null;

  /** Payload filter expression (JSON). Set to null to remove. */
  public filter?: Record<string, unknown> | null;

  /** Maximum time in seconds to wait for a delivery response. */
  public timeout_seconds?: number;

  /** Maximum number of delivery attempts before permanent failure. */
  public max_attempts?: number;

  /** Whether to verify the receiver's SSL certificate. */
  public verify_ssl?: boolean;

  /** Whether to gzip-compress delivery payloads. */
  public compress_payload?: boolean;

  /** Array of backoff delays in seconds between retry attempts. */
  public backoff_seconds?: number[] | null;

  /** Per-subscription rate limit (deliveries per minute). */
  public rate_limit_per_minute?: number | null;

  /** Destination driver name. */
  public destination?: string;

  /** Per-driver configuration. */
  public destination_config?: Record<string, unknown> | null;

  /** Number of consecutive failures before auto-disabling. */
  public consecutive_failure_threshold?: number;
}
