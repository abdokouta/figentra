/**
 * @file webhook-event.decorator.ts
 * @module @stackra/nestjs-webhook/decorators
 * @description Class decorator marking a domain event as forwardable via webhooks.
 *   Stores event metadata (wire-format name, version, description) on the class
 *   so the WebhookRegistry can discover and catalog it at module initialization.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';

// ============================================================================
// Constants
// ============================================================================

/**
 * Metadata key used to store webhook event options on decorated classes.
 */
const WEBHOOK_EVENT_METADATA_KEY = 'webhook:event';

// ============================================================================
// Interfaces
// ============================================================================

// ============================================================================
// Decorator
// ============================================================================

/**
 * Class decorator that marks a domain event as forwardable via webhooks.
 *
 * The WebhookRegistry collects all classes decorated with `@WebhookEvent()`
 * and uses the metadata to match subscriptions by event name.
 *
 * @param options - Event metadata including wire-format name.
 * @returns A class decorator function.
 *
 * @example
 * ```typescript
 * @WebhookEvent({ name: 'order.created', version: '2024-01' })
 * export class OrderCreatedEvent {
 *   constructor(public readonly order: Order) {}
 * }
 * ```
 */
export function WebhookEvent(options: IWebhookEventOptions): ClassDecorator {
  return (target: Function) => {
    defineMetadata(WEBHOOK_EVENT_METADATA_KEY, options, target);
  };
}

// ============================================================================
// Metadata Reader
// ============================================================================

/**
 * Retrieve webhook event metadata from a decorated class.
 *
 * Returns the `IWebhookEventOptions` stored by the `@WebhookEvent()` decorator,
 * or `undefined` if the class is not decorated.
 *
 * @param target - The class constructor to inspect.
 * @returns The webhook event options, or undefined if not decorated.
 *
 * @example
 * ```typescript
 * const meta = getWebhookEventMetadata(OrderCreatedEvent);
 * // { name: 'order.created', version: '2024-01' }
 * ```
 */
export function getWebhookEventMetadata(target: Function): IWebhookEventOptions | undefined {
  return getMetadata<IWebhookEventOptions>(WEBHOOK_EVENT_METADATA_KEY, target);
}

export { WEBHOOK_EVENT_METADATA_KEY };
