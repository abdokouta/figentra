/**
 * @file webhook-event-options.interface.ts
 * @module @stackra/webhook/src/interfaces
 * @description IWebhookEventOptions interface.
 */

/**
 * Options for the `@WebhookEvent()` class decorator.
 */
export interface IWebhookEventOptions {
  /** Wire-format event name (e.g., 'order.placed', 'customer.created'). */
  name: string;

  /** Optional version string (e.g., 'v1', '2024-10'). */
  version?: string;

  /** Human-readable description for the events catalog. */
  description?: string;
}
