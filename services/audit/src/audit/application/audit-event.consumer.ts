/**
 * @file audit-event.consumer.ts
 * @description NATS audit-event consumer.
 */
import { Controller } from "@nestjs/common";
import { EventPattern, type Payload } from "@nestjs/microservices";
import { AuditRequestedEventSchema, type AuditRequestedEvent } from "@figentra/events";
import type { MessageEnvelope } from "@stackra/contracts";
import { AuditService } from "./audit.service";

import { RegisterEvent } from "@figentra/registry-worker-sdk";

/**
 * Consumes durable audit requests emitted by service outboxes.
 */
@RegisterEvent({
  key: "figentra.audit.record.v1",
  direction: "consumes",
  topic: "figentra.audit.record.v1",
  version: "1",
})
@Controller()
export class AuditEventConsumer {
  /**
   * @param auditService - Audit append use case.
   */
  public constructor(private readonly auditService: AuditService) { }

  /**
   * Consumes one versioned audit event.
   *
   * @param envelope - Transport envelope carrying the audit payload.
   */
  @EventPattern("figentra.audit.record.v1")
  public async consume(
    @Payload() envelope: MessageEnvelope & { payload: AuditRequestedEvent },
  ): Promise<void> {
    const parsed = AuditRequestedEventSchema.parse(envelope.payload);

    await this.auditService.append({
      ...parsed,
      eventId: parsed.eventId ?? envelope.id,
      occurredAt: parsed.occurredAt
        ? new Date(parsed.occurredAt)
        : new Date(envelope.timestamp),
      correlationId: parsed.correlationId ?? envelope.correlationId,
    });
  }
}
