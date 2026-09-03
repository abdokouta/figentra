/**
 * @file webhook-subscription.service.ts
 * @module @stackra/nestjs-webhook/services
 * @description Custom service for WebhookSubscription extending `defineService()`.
 *   Provides state machine transitions (pause, resume), secret rotation,
 *   and auto-generation of secrets on creation.
 */

import { IInjectable, Logger } from '@nestjs/common';
import { InjectRepository, defineService } from '@stackra/nestjs-orm';
import { EntityRepository } from '@mikro-orm/core';
import { randomBytes } from 'crypto';

import { WebhookSubscription } from '../entities';
import { SubscriptionState } from '../enums';

// ============================================================================
// Service
// ============================================================================

/**
 * Webhook subscription management service.
 *
 * Extends the auto-generated CRUD service with domain-specific operations:
 * - Auto-generates HMAC secret on creation if not provided
 * - State machine transitions: pause, resume
 * - Secret rotation with grace window support
 *
 * @example
 * ```typescript
 * // Create a subscription (secret auto-generated)
 * const sub = await service.create({ name: 'My Hook', url: '...', events: ['order.created'] });
 *
 * // Pause/resume
 * await service.pause(sub.id);
 * await service.resume(sub.id);
 *
 * // Rotate secret
 * await service.rotateSecret(sub.id);
 * ```
 */
@IInjectable()
export class WebhookSubscriptionService extends defineService(WebhookSubscription) {
  /** Scoped logger instance. */
  private readonly logger = new Logger(WebhookSubscriptionService.name);

  /**
   * @param repo - Repository for WebhookSubscription entity.
   */
  public constructor(
    @InjectRepository(WebhookSubscription)
    repo: EntityRepository<WebhookSubscription>
  ) {
    super(repo);
  }

  // ── Overrides ─────────────────────────────────────────────────────────

  /**
   * Create a new webhook subscription.
   *
   * Auto-generates a cryptographically secure secret if one is not provided
   * in the input data.
   *
   * @param input - Subscription creation data.
   * @param ctx - Optional context (user, tenant).
   * @returns The created subscription entity.
   */
  public async create(input: any, ctx?: any): Promise<WebhookSubscription> {
    // Auto-generate secret if not provided
    if (!input.secret) {
      input.secret = randomBytes(32).toString('hex');
    }

    return super.create(input, ctx);
  }

  // ── State Machine ─────────────────────────────────────────────────────

  /**
   * Pause a subscription (Active → Paused).
   *
   * Paused subscriptions are skipped during fan-out but can be resumed.
   *
   * @param id - The subscription UUID.
   * @returns The updated subscription entity.
   * @throws Error if the subscription is not in Active state.
   */
  public async pause(id: string): Promise<WebhookSubscription> {
    const em = this.repo.getEntityManager();
    const subscription = await em.findOneOrFail(WebhookSubscription, { id } as any);

    if (subscription.state !== SubscriptionState.ACTIVE) {
      throw new Error(
        `Cannot pause subscription "${id}": current state is "${subscription.state}", expected "active"`
      );
    }

    subscription.state = SubscriptionState.PAUSED;
    await em.flush();

    this.logger.log(`Subscription "${id}" paused`);
    return subscription;
  }

  /**
   * Resume a paused subscription (Paused → Active).
   *
   * Only subscriptions in Paused state can be resumed. Disabled subscriptions
   * cannot be reactivated (terminal state).
   *
   * @param id - The subscription UUID.
   * @returns The updated subscription entity.
   * @throws Error if the subscription is not in Paused state.
   */
  public async resume(id: string): Promise<WebhookSubscription> {
    const em = this.repo.getEntityManager();
    const subscription = await em.findOneOrFail(WebhookSubscription, { id } as any);

    if (subscription.state !== SubscriptionState.PAUSED) {
      throw new Error(
        `Cannot resume subscription "${id}": current state is "${subscription.state}", expected "paused"`
      );
    }

    subscription.state = SubscriptionState.ACTIVE;
    await em.flush();

    this.logger.log(`Subscription "${id}" resumed`);
    return subscription;
  }

  // ── Secret Rotation ───────────────────────────────────────────────────

  /**
   * Rotate the subscription's HMAC secret.
   *
   * Copies the current secret to `secret_previous`, sets the new secret,
   * and records `secret_rotated_at`. During the rotation grace window,
   * both signatures are included in deliveries.
   *
   * @param id - The subscription UUID.
   * @param newSecret - Optional new secret. Auto-generated if not provided.
   * @returns The updated subscription entity.
   */
  public async rotateSecret(id: string, newSecret?: string): Promise<WebhookSubscription> {
    const em = this.repo.getEntityManager();
    const subscription = await em.findOneOrFail(WebhookSubscription, { id } as any);

    // Copy current secret to previous
    subscription.secret_previous = subscription.secret;
    subscription.secret_rotated_at = new Date();

    // Set new secret
    subscription.secret = newSecret ?? randomBytes(32).toString('hex');

    await em.flush();

    this.logger.log(`Secret rotated for subscription "${id}"`);
    return subscription;
  }
}
