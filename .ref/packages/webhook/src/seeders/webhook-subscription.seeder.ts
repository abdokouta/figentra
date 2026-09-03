/**
 * @file webhook-subscription.seeder.ts
 * @module database/seeders
 * @description Seeder for WebhookSubscription entity.
 *
 *   Creates development/test data using the WebhookSubscriptionFactory.
 *   Stores created IDs in SeederContext for downstream FK references.
 */

import { BaseSeeder, SeederContext } from '@stackra/nestjs-orm';
import type { EntityManager } from '@mikro-orm/postgresql';
import { WebhookSubscriptionFactory } from '../factories/webhook-subscription.factory';
import { WebhookSubscription } from '../entities/webhook-subscription.entity';

// ============================================================================
// Seeder
// ============================================================================

/**
 * WebhookSubscription seeder.
 *
 * Populates the database with WebhookSubscription records and stores their IDs
 * in SeederContext so downstream seeders can reference them via FK fields.
 */
export class WebhookSubscriptionSeeder extends BaseSeeder {
  /**
   * Run the seeder to populate WebhookSubscription records.
   *
   * @param em - MikroORM EntityManager for database operations.
   */
  public async run(em: EntityManager): Promise<void> {
    const factory = WebhookSubscriptionFactory.make(em);
    const entities = await factory.create(10);

    // Store IDs for downstream seeders that reference WebhookSubscription
    SeederContext.store(WebhookSubscription, entities);
  }
}
