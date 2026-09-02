/** Canonical transport-neutral event envelope. */
export interface FigentraEventEnvelope<TPayload = unknown> {
  readonly id: string;
  readonly type: string;
  readonly version: string;
  readonly producer: string;
  readonly payload: TPayload;
  readonly subject?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly occurredAt?: string;
  readonly metadata?: Record<string, unknown>;
}
