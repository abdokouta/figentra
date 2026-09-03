/**
 * @file webhook-delivery.entity.ts
 * @module nestjs-webhook/entities
 * @description WebhookDelivery entity.
 */

import { Entity, Property, Timestamps, BaseEntity } from '@stackra/nestjs-orm';

@Entity({ tableName: 'webhook_deliveries' })
@Timestamps()
export class WebhookDelivery extends BaseEntity {
  /** FK to subscription (cross-module reference). */
  @Property({ type: 'uuid', index: true })
  public subscription_id!: string;

  /** Event name. */
  @Property()
  public event_name!: string;

  /** Event version. */
  @Property({ nullable: true })
  public event_version?: string;

  /** FK to event (cross-module reference). */
  @Property({ type: 'uuid', nullable: true, index: true })
  public event_id?: string;

  /** Payload. */
  @Property({ type: 'json' })
  public payload!: Record<string, any>;

  /** Signature. */
  @Property({ nullable: true })
  public signature?: string;

  /** Request headers. */
  @Property({ type: 'json', nullable: true })
  public request_headers?: Record<string, any>;

  /** Status code. */
  @Property({ type: 'integer', nullable: true })
  public status_code?: number;

  /** Duration ms. */
  @Property({ type: 'integer', nullable: true })
  public duration_ms?: number;

  /** Response headers. */
  @Property({ type: 'json', nullable: true })
  public response_headers?: Record<string, any>;

  /** Response body. */
  @Property({ type: 'text', nullable: true })
  public response_body?: string;

  /** Response body sha256. */
  @Property({ nullable: true })
  public response_body_sha256?: string;

  /** Error message. */
  @Property({ type: 'text', nullable: true })
  public error_message?: string;

  /** State. */
  @Property()
  public state!: string;

  /** Attempt. */
  @Property({ type: 'integer' })
  public attempt!: number;

  /** Max attempts. */
  @Property({ type: 'integer' })
  public max_attempts!: number;

  /** Timestamp when next retry occurred. */
  @Property({ type: 'datetime', nullable: true })
  public next_retry_at?: Date;

  /** Timestamp when attempted occurred. */
  @Property({ type: 'datetime', nullable: true })
  public attempted_at?: Date;

  /** Timestamp when completed occurred. */
  @Property({ type: 'datetime', nullable: true })
  public completed_at?: Date;
}
