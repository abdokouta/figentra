/**
 * @file audit-entry.response.ts
 * @description Stable Audit HTTP response contract.
 */
/**
 * Public response shape that avoids leaking ORM implementation details.
 */
export interface AuditEntryResponse {
  /** Audit identifier. */
  readonly id: string;
  /** Tenant identifier. */
  readonly tenantId?: string;
  /** Actor identifier. */
  readonly actorId?: string;
  /** Actor type. */
  readonly actorType?: string;
  /** Action. */
  readonly action: string;
  /** Resource type. */
  readonly resourceType?: string;
  /** Resource identifier. */
  readonly resourceId?: string;
  /** Outcome. */
  readonly outcome: string;
  /** Producing service. */
  readonly sourceService: string;
  /** Event identifier. */
  readonly eventId?: string;
  /** Correlation identifier. */
  readonly correlationId?: string;
  /** Request identifier. */
  readonly requestId?: string;
  /** Trace identifier. */
  readonly traceId?: string;
  /** Client IP. */
  readonly ipAddress?: string;
  /** User agent. */
  readonly userAgent?: string;
  /** Metadata. */
  readonly metadata?: Record<string, unknown>;
  /** Occurrence time. */
  readonly occurredAt: string;
  /** Creation time. */
  readonly createdAt: string;
  /** Stream key. */
  readonly streamKey: string;
  /** Previous hash. */
  readonly previousHash?: string;
  /** Record hash. */
  readonly recordHash: string;
}

