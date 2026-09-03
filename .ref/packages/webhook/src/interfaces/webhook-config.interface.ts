/**
 * @file webhook-config.interface.ts
 * @module @stackra/nestjs-webhook/interfaces
 * @description Configuration interface for the webhook module.
 *   Defines the shape of the resolved configuration object passed
 *   to all webhook services via the WEBHOOK_CONFIG DI token.
 */

// ============================================================================
// Interface
// ============================================================================

/**
 * Webhook module configuration.
 *
 * Controls queue settings, signing, delivery defaults, audit retention,
 * status code policies, health probes, and batching behavior.
 */
export interface IWebhookConfig {
  /** Queue configuration for delivery jobs. */
  queue: {
    /** BullMQ connection name (undefined = default). */
    connection?: string;
    /** Queue name for webhook delivery jobs. */
    name: string;
  };

  /** Fan-out batching configuration. */
  batching: {
    /** Whether to wrap per-subscription jobs in a batch. */
    enabled: boolean;
    /** Name template for batches (e.g., 'webhook:%s'). */
    name_template: string;
  };

  /** Whether to wait for DB transaction commit before enqueuing. */
  after_commit: boolean;

  /** Signing configuration. */
  signing: {
    /** Hash algorithm for HMAC (e.g., 'sha256'). */
    algorithm: string;
    /** Replay window in seconds for timestamp validation. */
    replay_window_seconds: number;
    /** Header name for delivery ID. */
    header_id: string;
    /** Header name for event name. */
    header_event: string;
    /** Header name for timestamp. */
    header_timestamp: string;
    /** Header name for signature. */
    header_signature: string;
    /** Header name for attempt number. */
    header_attempt: string;
    /** Header name for previous signature (during rotation). */
    header_signature_previous: string;
    /** Grace window in seconds for secret rotation. */
    rotation_grace_seconds: number;
  };

  /** Default delivery settings (used when subscription column is null). */
  defaults: {
    /** HTTP method for delivery requests. */
    http_verb: string;
    /** Request timeout in seconds. */
    timeout_seconds: number;
    /** Maximum delivery attempts. */
    max_attempts: number;
    /** Static array of backoff delays in seconds. */
    backoff_seconds: number[];
    /** Default backoff strategy name. */
    backoff_strategy: string;
    /** Consecutive failures before auto-disable. */
    consecutive_failure_threshold: number;
    /** User-Agent header value. */
    user_agent: string;
    /** Whether to verify SSL certificates. */
    verify_ssl: boolean;
    /** Whether to gzip-compress payloads. */
    compress_payload: boolean;
    /** Default rate limit (requests per minute per subscription). */
    rate_limit_per_minute?: number;
    /** Whether to throw on final failure (surfaces in failed-jobs). */
    throw_on_final_failure: boolean;
  };

  /** Audit log configuration. */
  audit: {
    /** Maximum request body bytes to store. */
    max_request_body_bytes: number;
    /** Maximum response body bytes to store. */
    max_response_body_bytes: number;
    /** Days of delivery history to retain (0 = forever). */
    prune_after_days: number;
    /** Maximum rows to delete per prune run (0 = unbounded). */
    prune_chunk_size: number;
  };

  /** HTTP status code classification policy. */
  status_policy: {
    /** Status codes that indicate successful delivery. */
    success_codes: number[];
    /** Status codes that indicate a retryable failure. */
    retryable_codes: number[];
    /** Status codes that permanently disable the subscription. */
    permanent_disable_codes: number[];
  };

  /** Health probe configuration. */
  probe: {
    /** HTTP method for probes (HEAD or GET). */
    method: string;
    /** Probe timeout in seconds. */
    timeout_seconds: number;
    /** Consecutive probe failures before emitting event. */
    failure_threshold: number;
  };

  /** Wire-format name for synthetic test events. */
  test_event_name: string;
}
