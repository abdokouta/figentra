/**
 * @file clear-rotated-secrets.task.ts
 * @module @stackra/nestjs-webhook/tasks
 * @description Scheduled task that clears `secret_previous` on subscriptions
 *   where the rotation grace window has expired. After clearing, only the
 *   current secret's signature is sent with deliveries.
 */

import { IInjectable, Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@stackra/nestjs-orm';
import { EntityRepository } from '@mikro-orm/core';

import type { IWebhookConfig } from '../interfaces';
import { WebhookSubscription } from '../entities';
import { WEBHOOK_CONFIG } from '../constants';

// ============================================================================
// Task
// ============================================================================

/**
 * Clear rotated secrets scheduled task.
 *
 * Runs every hour and clears `secret_previous` on subscriptions where the
 * rotation grace window has expired. This stops the dual-signature behavior
 * and ensures only the current secret is used for signing.
 *
 * @example
 * ```typescript
 * // Manually trigger (for testing)
 * await clearRotatedSecretsTask.clearExpired();
 * ```
 */
@IInjectable()
export class ClearRotatedSecretsTask {
  /** Scoped logger instance. */
  private readonly logger = new Logger(ClearRotatedSecretsTask.name);

  /**
   * @param subscriptionRepo - Repository for querying and updating subscriptions.
   * @param config - Global webhook configuration.
   */
  public constructor(
    @InjectRepository(WebhookSubscription)
    private readonly subscriptionRepo: EntityRepository<WebhookSubscription>,
    @Inject(WEBHOOK_CONFIG)
    private readonly config: IWebhookConfig
  ) {}

  // ── Scheduled execution ───────────────────────────────────────────────

  /**
   * Clear expired rotated secrets.
   *
   * Runs every hour via `@Cron`. Finds subscriptions with a `secret_previous`
   * whose rotation grace window has expired, and clears the previous secret.
   */
  @Cron('0 * * * *')
  public async clearExpired(): Promise<void> {
    const graceSeconds = this.config.signing.rotation_grace_seconds;
    const cutoffDate = new Date(Date.now() - graceSeconds * 1000);

    // Find subscriptions with expired rotation grace
    const subscriptions = await this.subscriptionRepo.find({
      secret_previous: { $ne: null },
      secret_rotated_at: { $lt: cutoffDate },
    } as any);

    if (subscriptions.length === 0) {
      return;
    }

    this.logger.log(`Clearing ${subscriptions.length} expired rotated secret(s)`);

    for (const subscription of subscriptions) {
      subscription.secret_previous = null as any;
      subscription.secret_rotated_at = null as any;
    }

    await this.subscriptionRepo.getEntityManager().flush();

    this.logger.log(`Cleared ${subscriptions.length} rotated secret(s)`);
  }
}
