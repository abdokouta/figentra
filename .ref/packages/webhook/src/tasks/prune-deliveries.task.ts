/**
 * @file prune-deliveries.task.ts
 * @module @stackra/nestjs-webhook/tasks
 * @description Scheduled task that deletes webhook deliveries older than the
 *   configured retention period. Processes in chunks to avoid long transactions.
 */

import { IInjectable, Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@stackra/nestjs-orm';
import { EntityRepository } from '@mikro-orm/core';

import type { IWebhookConfig } from '../interfaces';
import { WebhookDelivery } from '../entities';
import { WEBHOOK_CONFIG } from '../constants';

// ============================================================================
// Task
// ============================================================================

/**
 * Delivery pruning scheduled task.
 *
 * Runs daily at 03:00 and deletes webhook delivery records older than
 * `audit.prune_after_days`. Processes deletions in chunks of
 * `audit.prune_chunk_size` to avoid long-running transactions and
 * excessive memory usage.
 *
 * @example
 * ```typescript
 * // Manually trigger (for testing)
 * await pruneDeliveriesTask.prune();
 * ```
 */
@IInjectable()
export class PruneDeliveriesTask {
  /** Scoped logger instance. */
  private readonly logger = new Logger(PruneDeliveriesTask.name);

  /**
   * @param deliveryRepo - Repository for querying and deleting deliveries.
   * @param config - Global webhook configuration.
   */
  public constructor(
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepo: EntityRepository<WebhookDelivery>,
    @Inject(WEBHOOK_CONFIG)
    private readonly config: IWebhookConfig
  ) {}

  // ── Scheduled execution ───────────────────────────────────────────────

  /**
   * Prune old webhook delivery records.
   *
   * Runs daily at 03:00 via `@Cron`. Deletes deliveries older than the
   * configured retention period in chunks to avoid long transactions.
   */
  @Cron('0 3 * * *')
  public async prune(): Promise<void> {
    const pruneAfterDays = this.config.audit.prune_after_days;

    if (pruneAfterDays <= 0) {
      this.logger.debug('Pruning disabled (prune_after_days = 0)');
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - pruneAfterDays);

    const chunkSize = this.config.audit.prune_chunk_size ?? 1000;
    let totalDeleted = 0;
    let deletedInChunk: number;

    this.logger.log(
      `Pruning deliveries older than ${pruneAfterDays} days (before ${cutoffDate.toISOString()})`
    );

    do {
      deletedInChunk = await this.deleteChunk(cutoffDate, chunkSize);
      totalDeleted += deletedInChunk;
    } while (deletedInChunk >= chunkSize);

    if (totalDeleted > 0) {
      this.logger.log(`Pruned ${totalDeleted} delivery record(s)`);
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Delete a chunk of old delivery records.
   *
   * @param cutoffDate - Delete records created before this date.
   * @param chunkSize - Maximum number of records to delete per chunk.
   * @returns The number of records deleted in this chunk.
   */
  private async deleteChunk(cutoffDate: Date, chunkSize: number): Promise<number> {
    const deliveries = await this.deliveryRepo.find({ createdAt: { $lt: cutoffDate } } as any, {
      limit: chunkSize,
      fields: ['id'] as any,
    });

    if (deliveries.length === 0) {
      return 0;
    }

    const ids = deliveries.map((d: any) => d.id);
    const em = this.deliveryRepo.getEntityManager();
    const deleted = await em.nativeDelete(WebhookDelivery, { id: { $in: ids } } as any);

    return deleted;
  }
}
