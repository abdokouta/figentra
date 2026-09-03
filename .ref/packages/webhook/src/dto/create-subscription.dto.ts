/**
 * Create webhook subscription DTO.
 *
 * Input shape for creating a new webhook subscription. The `secret`
 * field is auto-generated if not provided by the caller.
 *
 * @module @stackra/nestjs-webhook/dto/create-subscription
 */

/**
 * Data transfer object for creating a webhook subscription.
 */
export class CreateSubscriptionDto {
  /** Human-readable subscription name. */
  public name!: string;

  /** Target URL for webhook deliveries. */
  public url!: string;

  /** Array of event names this subscription listens for. */
  public events!: string[];

  /** HMAC secret for signing payloads (auto-generated if omitted). */
  public secret?: string;

  /** HTTP method for deliveries (default: POST). */
  public http_verb?: string;

  /** Custom HTTP headers to include in delivery requests. */
  public headers?: Record<string, string>;

  /** Payload filter expression (JSON). */
  public filter?: Record<string, unknown>;

  /** Maximum time in seconds to wait for a delivery response. */
  public timeout_seconds?: number;

  /** Maximum number of delivery attempts before permanent failure. */
  public max_attempts?: number;

  /** Optional description of the subscription's purpose. */
  public description?: string;

  /** Tenant ID for multi-tenant scoping. */
  public owner_id?: string;

  /** Destination driver name (default: 'https'). */
  public destination?: string;

  /** Per-driver configuration. */
  public destination_config?: Record<string, unknown>;

  /** Whether to verify the receiver's SSL certificate. */
  public verify_ssl?: boolean;

  /** Whether to gzip-compress delivery payloads. */
  public compress_payload?: boolean;

  /** Array of backoff delays in seconds between retry attempts. */
  public backoff_seconds?: number[];

  /** Per-subscription rate limit (deliveries per minute). */
  public rate_limit_per_minute?: number;
}
