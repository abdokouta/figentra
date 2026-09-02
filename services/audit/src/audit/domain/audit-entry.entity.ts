/**
 * @file audit-entry.entity.ts
 * @description Immutable audit ledger entity.
 */
import { Entity, Index, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";

/**
 * Durable audit record.
 *
 * @remarks
 * The application layer exposes append/read operations only. Normal UPDATE and
 * DELETE operations are intentionally absent from the domain API.
 */
@Entity({ tableName: "audit_entries" })
@Index({ name: "idx_audit_tenant_time", properties: ["tenantId", "occurredAt"] })
@Index({ name: "idx_audit_actor_time", properties: ["actorId", "occurredAt"] })
@Index({ name: "idx_audit_resource_time", properties: ["resourceType", "resourceId", "occurredAt"] })
@Index({ name: "idx_audit_action_time", properties: ["action", "occurredAt"] })
@Index({ name: "idx_audit_stream_time", properties: ["streamKey", "createdAt"] })
@Index({ name: "idx_audit_event_id", properties: ["eventId"], options: { unique: true } })
/** Public symbol `AuditEntry`. */
export class AuditEntry {
  /** Stable audit identifier. */
  @PrimaryKey({ type: "uuid" })
  id!: string;

  /** Tenant owning the audited action. */
  @Property({ nullable: true, length: 128 })
  tenantId?: string;

  /** Trusted actor/principal identifier. */
  @Property({ nullable: true, length: 256 })
  actorId?: string;

  /** Actor classification. */
  @Property({ nullable: true, length: 64 })
  actorType?: string;

  /** Canonical action name. */
  @Property({ length: 160 })
  action!: string;

  /** Affected resource type. */
  @Property({ nullable: true, length: 160 })
  resourceType?: string;

  /** Affected resource identifier. */
  @Property({ nullable: true, length: 256 })
  resourceId?: string;

  /** Operation result. */
  @Property({ length: 32 })
  outcome!: "success" | "failure" | "denied";

  /** Producing service identity. */
  @Property({ length: 128 })
  sourceService!: string;

  /** Upstream event ID used for idempotency. */
  @Property({ nullable: true, length: 256 })
  eventId?: string;

  /** Distributed correlation identifier. */
  @Property({ nullable: true, length: 256 })
  correlationId?: string;

  /** Request identifier. */
  @Property({ nullable: true, length: 256 })
  requestId?: string;

  /** Distributed trace identifier. */
  @Property({ nullable: true, length: 128 })
  traceId?: string;

  /** Client IP when permitted by policy. */
  @Property({ nullable: true, length: 128 })
  ipAddress?: string;

  /** Bounded user-agent metadata. */
  @Property({ nullable: true, length: 1024 })
  userAgent?: string;

  /** Non-secret structured metadata. */
  @Property({ type: "json", nullable: true })
  metadata?: Record<string, unknown>;

  /** Trusted occurrence timestamp. */
  @Property({ type: "timestamptz" })
  occurredAt!: Date;

  /** Database insertion timestamp. */
  @Property({ type: "timestamptz", onCreate: () => new Date() })
  createdAt!: Date;

  /** Logical stream used for tamper-evident chaining. */
  @Property({ length: 256 })
  streamKey!: string;

  /** Previous record hash in this stream. */
  @Property({ nullable: true, length: 128 })
  previousHash?: string;

  /** SHA-256 digest of the canonical record. */
  @Property({ length: 128 })
  recordHash!: string;
}
