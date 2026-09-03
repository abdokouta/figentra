/**
 * @file webhook-subscription.factory.ts
 * @module database/factories
 * @description Factory for generating WebhookSubscription test/seed data.
 *
 *   Uses Faker.js to produce realistic fake values for each field.
 *   Extend or override `definition()` for custom states.
 */

import { BaseFactory } from '@stackra/nestjs-orm';
import { WebhookSubscription } from '../entities/webhook-subscription.entity';
import { Tenant } from '../../../../domain/governance/tenancy/tenant/src/api/entities/tenant.entity';
import { AppInstallation } from '../../../../domain/marketplace/installation/src/entities/app-installation.entity';

// ============================================================================
// Factory
// ============================================================================

/**
 * WebhookSubscription entity factory.
 *
 * Generates realistic fake data for the WebhookSubscription entity.
 * Used by seeders to populate development/test databases.
 *
 * @example
 * ```typescript
 * const factory = WebhookSubscriptionFactory.make(em);
 * const single = factory.makeOne();
 * const batch = await factory.create(10);
 * ```
 */
export class WebhookSubscriptionFactory extends BaseFactory<WebhookSubscription> {
  /** The entity class this factory creates instances of. */
  public readonly model = WebhookSubscription;

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
      owner_id: this.context.random(Tenant)?.id, // nullable
      app_installation_id: this.context.random(AppInstallation)?.id, // nullable
      name: this.faker.person.fullName(),
      description: this.faker.lorem.paragraph(), // nullable
      url: this.faker.internet.url(),
      http_verb: this.faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
      destination: this.faker.helpers.arrayElement(['https', 'http', 'sqs', 'sns', 'redis']),
      destination_config: {}, // nullable
      events: {},
      filter: {}, // nullable
      api_version: this.faker.helpers.arrayElement(['v1', 'v2', 'v2.1', 'v3']),
      mandatory: this.faker.datatype.boolean(),
      headers: {}, // nullable
      secret: this.faker.string.alphanumeric(32),
      secret_previous: this.faker.string.alphanumeric(32), // nullable
      secret_rotated_at: this.faker.date.recent(), // nullable
      signature_algorithm: this.faker.helpers.arrayElement(['sha256', 'sha512', 'hmac-sha256']),
      proxy: this.faker.lorem.words(3), // nullable
      verify_ssl: this.faker.datatype.boolean(),
      compress_payload: this.faker.datatype.boolean(),
      state: 'active',
      timeout_seconds: this.faker.number.int({ min: 1, max: 1000 }),
      max_attempts: this.faker.number.int({ min: 1, max: 1000 }),
      backoff_seconds: {}, // nullable
      backoff_strategy: this.faker.lorem.words(3), // nullable
      rate_limit_per_minute: this.faker.number.int({ min: 1, max: 1000 }), // nullable
      throw_on_final_failure: this.faker.datatype.boolean(),
      consecutive_failure_threshold: this.faker.number.int({ min: 1, max: 1000 }),
      consecutive_failures: this.faker.number.int({ min: 1, max: 1000 }),
      last_attempted_at: this.faker.date.recent(), // nullable
      last_succeeded_at: this.faker.date.recent(), // nullable
      last_failed_at: this.faker.date.recent(), // nullable
      total_attempts: this.faker.number.int({ min: 1, max: 1000 }),
      total_successes: this.faker.number.int({ min: 1, max: 1000 }),
      total_failures: this.faker.number.int({ min: 1, max: 1000 }),
    };
  }
}
