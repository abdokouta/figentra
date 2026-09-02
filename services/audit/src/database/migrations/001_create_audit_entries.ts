/**
 * @file 001_create_audit_entries.ts
 * @description Creates the append-only Audit Service ledger and indexes.
 *
 * One logical schema change is represented by one migration. The migration
 * uses explicit SQL so production DDL is reviewable and deterministic.
 */
import { Migration } from "@mikro-orm/migrations";

/**
 * Creates and removes the audit ledger schema.
 */
export class Migration001CreateAuditEntries extends Migration {
  /**
   * Applies the audit ledger schema.
   */
  public async up(): Promise<void> {
    this.addSql(`
      create table "audit_entries" (
        "id" uuid not null primary key,
        "tenant_id" varchar(128) null,
        "actor_id" varchar(256) null,
        "actor_type" varchar(64) null,
        "action" varchar(160) not null,
        "resource_type" varchar(160) null,
        "resource_id" varchar(256) null,
        "outcome" varchar(32) not null,
        "source_service" varchar(128) not null,
        "event_id" varchar(256) null,
        "correlation_id" varchar(256) null,
        "request_id" varchar(256) null,
        "trace_id" varchar(128) null,
        "ip_address" varchar(128) null,
        "user_agent" varchar(1024) null,
        "metadata" jsonb null,
        "occurred_at" timestamptz not null,
        "created_at" timestamptz not null default now(),
        "stream_key" varchar(256) not null,
        "previous_hash" varchar(128) null,
        "record_hash" varchar(128) not null,
        constraint "audit_entries_outcome_check"
          check ("outcome" in ('success', 'failure', 'denied')),
        constraint "audit_entries_event_id_unique" unique ("event_id")
      );

      create index "idx_audit_tenant_time"
        on "audit_entries" ("tenant_id", "occurred_at" desc);

      create index "idx_audit_actor_time"
        on "audit_entries" ("actor_id", "occurred_at" desc);

      create index "idx_audit_resource_time"
        on "audit_entries" ("resource_type", "resource_id", "occurred_at" desc);

      create index "idx_audit_action_time"
        on "audit_entries" ("action", "occurred_at" desc);

      create index "idx_audit_stream_time"
        on "audit_entries" ("stream_key", "created_at" desc);
    `);
  }

  /**
   * Reverts the audit ledger schema.
   */
  public async down(): Promise<void> {
    this.addSql('drop table if exists "audit_entries" cascade;');
  }
}
