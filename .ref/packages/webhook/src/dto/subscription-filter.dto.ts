/**
 * Subscription filter DTO.
 *
 * Query filter shape for listing webhook subscriptions.
 * All fields are optional — only provided fields are used
 * as filter criteria.
 *
 * @module @stackra/nestjs-webhook/dto/subscription-filter
 */

import type { SubscriptionState } from '../enums';

/**
 * Data transfer object for filtering webhook subscriptions.
 */
export class SubscriptionFilterDto {
  /** Filter by subscription lifecycle state. */
  public state?: SubscriptionState;

  /** Filter by tenant ID (multi-tenant scoping). */
  public owner_id?: string;

  /** Filter by subscriptions listening for a specific event name. */
  public event?: string;
}
