/**
 * @file audit.controller.ts
 * @description Versioned internal Audit API.
 */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuditService } from "../application/audit.service.js";
import { AuditQueryDto } from "./dtos/audit-query.dto.js";
import { IamAuthorizationGuard, RequirePermission, ServiceIdentityGuard } from "@figentra/security";
import type { AuditEntry } from "../domain/audit-entry.entity.js";
import type { AuditEntryResponse } from "./responses/audit-entry.response.js";

/**
 * Internal audit API controller.
 *
 * @remarks
 * Authentication and IAM authorization must be applied before this controller
 * is exposed to service principals or administrators.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Serializes an entity to an API-safe response.
 *
 * @param entry - Audit entity.
 * @returns Stable transport representation.
 */
function serializeAuditEntry(entry: AuditEntry): AuditEntryResponse {
  return {
    id: entry.id,
    tenantId: entry.tenantId,
    actorId: entry.actorId,
    actorType: entry.actorType,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    outcome: entry.outcome,
    sourceService: entry.sourceService,
    eventId: entry.eventId,
    correlationId: entry.correlationId,
    requestId: entry.requestId,
    traceId: entry.traceId,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    metadata: entry.metadata,
    occurredAt: entry.occurredAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    streamKey: entry.streamKey,
    previousHash: entry.previousHash,
    recordHash: entry.recordHash,
  };
}

@UseGuards(ServiceIdentityGuard, IamAuthorizationGuard)
@Controller({ path: "audit", version: "1" })
/** Public symbol `AuditController`. */
export class AuditController {
  /**
   * @param auditService - Audit application service.
   */
  public constructor(private readonly auditService: AuditService) {}

  /**
   * Queries the immutable audit ledger.
   *
   * @param dto - Validated filters.
   * @returns Bounded result page.
   */
  @Get()
  @RequirePermission("audit.read")
  public async query(@Query() dto: AuditQueryDto) {
    const result = await this.auditService.query({
      ...dto,
      from: dto.from ? new Date(dto.from) : undefined,
      to: dto.to ? new Date(dto.to) : undefined,
    });

    return {
      items: result.items.map(serializeAuditEntry),
      total: result.total,
      limit: dto.limit,
      offset: dto.offset,
    };
  }

  /**
   * Gets one immutable audit record.
   *
   * @param id - Audit UUID.
   * @returns Serialized record.
   */
  @Get(":id")
  @RequirePermission("audit.read")
  public async findById(@Param("id") id: string): Promise<AuditEntryResponse | null> {
    if (!UUID_PATTERN.test(id)) {
      return null;
    }

    const entry = await this.auditService.findById(id);
    return entry ? serializeAuditEntry(entry) : null;
  }
}
