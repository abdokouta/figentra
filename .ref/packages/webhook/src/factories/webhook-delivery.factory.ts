/**
 * @file webhook-delivery.factory.ts
 * @module database/factories
 * @description Factory for generating WebhookDelivery test/seed data.
 *
 *   Uses Faker.js to produce realistic fake values for each field.
 *   Extend or override `definition()` for custom states.
 */

import { BaseFactory } from '@stackra/nestjs-orm';
import { WebhookDelivery } from '../entities/webhook-delivery.entity';
import { WebhookSubscription } from '../entities/webhook-subscription.entity';
import { Tenant } from '../../../../domain/governance/tenancy/tenant/src/api/entities/tenant.entity';

// ============================================================================
// Factory
// ============================================================================

/**
 * WebhookDelivery entity factory.
 *
 * Generates realistic fake data for the WebhookDelivery entity.
 * Used by seeders to populate development/test databases.
 *
 * @example
 * ```typescript
 * const factory = WebhookDeliveryFactory.make(em);
 * const single = factory.makeOne();
 * const batch = await factory.create(10);
 * ```
 */
export class WebhookDeliveryFactory extends BaseFactory<WebhookDelivery> {
  /** The entity class this factory creates instances of. */
  public readonly model = WebhookDelivery;

  /**
   * Define the default attribute values for the entity.
   *
   * Each call produces a unique set of values via Faker.js.
   * Override specific fields using `.makeOne({ field: value })`.
   *
   * @returns Default entity data with Faker-generated values.
   */
  protected definition(): Record<string, any> {
    return {
      id: this.faker.string.uuid(),
      subscription_id: this.context.random(WebhookSubscription)?.id,
      owner_id: this.context.random(Tenant)?.id, // nullable
      event_name: this.faker.lorem.words(3),
      event_version: this.faker.string.alphanumeric(10), // nullable
      event_id: this.faker.string.uuid(), // nullable
      payload: {},
      signature: this.faker.lorem.words(3), // nullable
      request_headers: {}, // nullable
      status_code: this.faker.number.int({ min: 1, max: 1000 }), // nullable
      duration_ms: this.faker.number.int({ min: 1, max: 1000 }), // nullable
      response_headers: {}, // nullable
      response_body: this.faker.lorem.paragraph(), // nullable
      response_body_sha256: this.faker.lorem.words(3), // nullable
      error_message: this.faker.lorem.paragraph(), // nullable
      state: 'active',
      attempt: this.faker.number.int({ min: 1, max: 1000 }),
      max_attempts: this.faker.number.int({ min: 1, max: 1000 }),
      next_retry_at: this.faker.date.recent(), // nullable
      attempted_at: this.faker.date.recent(), // nullable
      completed_at: this.faker.date.recent(), // nullable
    };
  }
}
