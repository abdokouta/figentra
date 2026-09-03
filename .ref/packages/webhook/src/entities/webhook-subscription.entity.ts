/**
 * @file webhook-subscription.entity.ts
 * @module nestjs-webhook/entities
 * @description WebhookSubscription entity.
 */

import { Entity, Property, Timestamps, BaseEntity } from '@stackra/nestjs-orm';

@Entity({ tableName: 'webhook_subscriptions' })
@Timestamps()
export class WebhookSubscription extends BaseEntity {
  /** FK to app installation (cross-module reference). */
  @Property({ type: 'uuid', nullable: true, index: true })
  public app_installation_id?: string;

  /** Name. */
  @Property()
  public name!: string;

  /** Description. */
  @Property({ type: 'text', nullable: true })
  public description?: string;

  /** Url. */
  @Property()
  public url!: string;

  /** Http verb. */
  @Property()
  public http_verb!: string;

  /** Destination. */
  @Property()
  public destination!: string;

  /** Destination config. */
  @Property({ type: 'json', nullable: true })
  public destination_config?: Record<string, any>;

  /** Events. */
  @Property({ type: 'json' })
  public events!: Record<string, any>;

  /** Filter. */
  @Property({ type: 'json', nullable: true })
  public filter?: Record<string, any>;

  /** Api version. */
  @Property()
  public api_version!: string;

  /** Mandatory. */
  @Property({ type: 'boolean' })
  public mandatory!: boolean;

  /** Headers. */
  @Property({ type: 'json', nullable: true })
  public headers?: Record<string, any>;

  /** Secret. */
  @Property()
  public secret!: string;

  /** Secret previous. */
  @Property({ nullable: true })
  public secret_previous?: string;

  /** Timestamp when secret rotated occurred. */
  @Property({ type: 'datetime', nullable: true })
  public secret_rotated_at?: Date;

  /** Signature algorithm. */
  @Property()
  public signature_algorithm!: string;

  /** Proxy. */
  @Property({ nullable: true })
  public proxy?: string;

  /** Verify ssl. */
  @Property({ type: 'boolean' })
  public verify_ssl!: boolean;

  /** Compress payload. */
  @Property({ type: 'boolean' })
  public compress_payload!: boolean;

  /** State. */
  @Property()
  public state!: string;

  /** Timeout seconds. */
  @Property({ type: 'integer' })
  public timeout_seconds!: number;

  /** Max attempts. */
  @Property({ type: 'integer' })
  public max_attempts!: number;

  /** Backoff seconds. */
  @Property({ type: 'json', nullable: true })
  public backoff_seconds?: Record<string, any>;

  /** Backoff strategy. */
  @Property({ nullable: true })
  public backoff_strategy?: string;

  /** Rate limit per minute. */
  @Property({ type: 'integer', nullable: true })
  public rate_limit_per_minute?: number;

  /** Throw on final failure. */
  @Property({ type: 'boolean' })
  public throw_on_final_failure!: boolean;

  /** Consecutive failure threshold. */
  @Property({ type: 'integer' })
  public consecutive_failure_threshold!: number;

  /** Consecutive failures. */
  @Property({ type: 'integer' })
  public consecutive_failures!: number;

  /** Timestamp when lasttempted at occurred. */
  @Property({ type: 'datetime', nullable: true })
  public last_attempted_at?: Date;

  /** Timestamp when last succeeded occurred. */
  @Property({ type: 'datetime', nullable: true })
  public last_succeeded_at?: Date;

  /** Timestamp when last failed occurred. */
  @Property({ type: 'datetime', nullable: true })
  public last_failed_at?: Date;

  /** Total attempts. */
  @Property({ type: 'integer' })
  public total_attempts!: number;

  /** Total successes. */
  @Property({ type: 'integer' })
  public total_successes!: number;

  /** Total failures. */
  @Property({ type: 'integer' })
  public total_failures!: number;
}
