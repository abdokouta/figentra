/**
 * @file audit.types.ts
 * @description Application-layer contracts for the immutable audit ledger.
 */

/** Supported audit outcomes. */
export type AuditOutcome = "success" | "failure" | "denied";

/** Trusted input used by the append use case. */
export interface CreateAuditEntryInput {
  /** Optional tenant identifier. */
  readonly tenantId?: string;
  /** Optional actor identifier. */
  readonly actorId?: string;
  /** Optional actor classification. */
  readonly actorType?: string;
  /** Stable action name. */
  readonly action: string;
  /** Optional resource classification. */
  readonly resourceType?: string;
  /** Optional resource identifier. */
  readonly resourceId?: string;
  /** Operation outcome. */
  readonly outcome: AuditOutcome;
  /** Producing service identifier. */
  readonly sourceService: string;
  /** Idempotency event identifier. */
  readonly eventId?: string;
  /** Correlation identifier. */
  readonly correlationId?: string;
  /** Request identifier. */
  readonly requestId?: string;
  /** Distributed trace identifier. */
  readonly traceId?: string;
  /** Source IP address. */
  readonly ipAddress?: string;
  /** Source user agent. */
  readonly userAgent?: string;
  /** Structured metadata. */
  readonly metadata?: Record<string, unknown>;
  /** Original occurrence time. */
  readonly occurredAt?: Date;
}

/** Bounded query contract for audit reads. */
export interface AuditQuery {
  /** Tenant filter. */
  readonly tenantId?: string;
  /** Actor filter. */
  readonly actorId?: string;
  /** Action filter. */
  readonly action?: string;
  /** Resource type filter. */
  readonly resourceType?: string;
  /** Resource identifier filter. */
  readonly resourceId?: string;
  /** Outcome filter. */
  readonly outcome?: AuditOutcome;
  /** Inclusive lower time boundary. */
  readonly from?: Date;
  /** Exclusive upper time boundary. */
  readonly to?: Date;
  /** Maximum result count. */
  readonly limit: number;
  /** Result offset. */
  readonly offset: number;
}
