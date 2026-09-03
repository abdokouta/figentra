/**
 * @file webhook-delivery.seeder.ts
 * @module database/seeders
 * @description Seeder for WebhookDelivery entity.
 *
 *   Creates development/test data using the WebhookDeliveryFactory.
 *   Stores created IDs in SeederContext for downstream FK references.
 */

import { BaseSeeder, SeederContext } from '@stackra/nestjs-orm';
import type { EntityManager } from '@mikro-orm/postgresql';
import { WebhookDeliveryFactory } from '../factories/webhook-delivery.factory';
import { WebhookDelivery } from '../entities/webhook-delivery.entity';

// ============================================================================
// Seeder
// ============================================================================

/**
 * WebhookDelivery seeder.
 *
 * Populates the database with WebhookDelivery records and stores their IDs
 * in SeederContext so downstream seeders can reference them via FK fields.
 */
export class WebhookDeliverySeeder extends BaseSeeder {
  /**
   * Run the seeder to populate WebhookDelivery records.
   *
   * @param em - MikroORM EntityManager for database operations.
   */
  public async run(em: EntityManager): Promise<void> {
    const factory = WebhookDeliveryFactory.make(em);
    const entities = await factory.create(10);

    // Store IDs for downstream seeders that reference WebhookDelivery
    SeederContext.store(WebhookDelivery, entities);
  }
}
