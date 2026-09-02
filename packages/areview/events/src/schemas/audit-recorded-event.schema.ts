/**
 * @file audit-recorded-event.schema.ts
 * @description Canonical Audit event payload contract.
 */
import { z } from "zod";

/**
 * Validated payload emitted by platform services and consumed by Audit.
 */
export const AuditRecordedEventSchema = z.object({
  tenantId: z.string().min(1).optional(),
  actorId: z.string().min(1).optional(),
  actorType: z.string().min(1).optional(),
  action: z.string().min(1).max(160),
  resourceType: z.string().min(1).max(160).optional(),
  resourceId: z.string().min(1).max(256).optional(),
  outcome: z.enum(["success", "failure", "denied"]),
  sourceService: z.string().min(1).max(128),
  eventId: z.string().min(1).max(256),
  correlationId: z.string().min(1).max(256).optional(),
  requestId: z.string().min(1).max(256).optional(),
  traceId: z.string().min(1).max(128).optional(),
  ipAddress: z.string().min(1).max(128).optional(),
  userAgent: z.string().max(1024).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.coerce.date().optional(),
});

/** Type inferred from the canonical schema. */
export type AuditRecordedEvent = z.infer<typeof AuditRecordedEventSchema>;
