/**
 * @file audit.service.ts
 * @description Append-only audit ledger application service.
 */
import { createHash, randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/postgresql";
import { AuditEntry } from "../domain/audit-entry.entity";
import type { AuditQuery, CreateAuditEntryInput } from "./audit.types";

/**
 * Implements audit append and query use cases.
 */
@Injectable()
export class AuditService {
  /**
   * @param em - MikroORM EntityManager supplied by Nest.
   */
  public constructor(private readonly em: EntityManager) { }

  /**
   * Appends one immutable record.
   *
   * @param input - Trusted audit command.
   * @returns Persisted audit entry.
   */
  public async append(input: CreateAuditEntryInput): Promise<AuditEntry> {
    const id = randomUUID();
    const occurredAt = input.occurredAt ?? new Date();
    const streamKey = input.tenantId ?? "platform";

    return this.em.transactional(async (em) => {
      if (input.eventId) {
        const existing = await em.findOne(AuditEntry, {
          eventId: input.eventId,
        });

        if (existing) {
          return existing;
        }
      }

      await em.getConnection().execute(
        "select pg_advisory_xact_lock(hashtext(?))",
        [streamKey],
      );

      const previous = await em.findOne(
        AuditEntry,
        { streamKey },
        { orderBy: { createdAt: "desc" } },
      );

      const canonical = JSON.stringify({
        id,
        ...input,
        occurredAt: occurredAt.toISOString(),
        streamKey,
        previousHash: previous?.recordHash ?? null,
      });

      const recordHash = createHash("sha256")
        .update(canonical)
        .digest("hex");

      const entry = em.create(AuditEntry, {
        id,
        ...input,
        occurredAt,
        streamKey,
        previousHash: previous?.recordHash,
        recordHash,
      });

      await em.persistAndFlush(entry);
      return entry;
    });
  }

  /**
   * Queries immutable records using bounded administrative filters.
   *
   * @param query - Validated query contract.
   * @returns Matching records and total count.
   */
  public async query(query: AuditQuery): Promise<{
    readonly items: readonly AuditEntry[];
    readonly total: number;
  }> {
    const where = {
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
      ...(query.resourceId ? { resourceId: query.resourceId } : {}),
      ...(query.outcome ? { outcome: query.outcome } : {}),
      ...(query.from || query.to
        ? {
          occurredAt: {
            ...(query.from ? { $gte: query.from } : {}),
            ...(query.to ? { $lt: query.to } : {}),
          },
        }
        : {}),
    };

    const [items, total] = await this.em.findAndCount(AuditEntry, where, {
      orderBy: { occurredAt: "desc" },
      limit: query.limit,
      offset: query.offset,
    });

    return { items, total };
  }

  /**
   * Finds one audit record by UUID.
   *
   * @param id - Audit UUID.
   * @returns Matching record or null.
   */
  public async findById(id: string): Promise<AuditEntry | null> {
    return this.em.findOne(AuditEntry, { id });
  }
}
