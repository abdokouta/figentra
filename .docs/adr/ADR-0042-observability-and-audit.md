# ADR-0042 — Observability and Audit

## Status
Accepted.

## Decision
Every service boundary propagates request ID, correlation ID and trace
context. Structured logs use Pino-compatible fields. Security-sensitive
authorization, identity, administrative and infrastructure mutations generate
audit records.

Operational telemetry is separate from immutable audit records.

## Consequences
Requests can be traced across HTTP/NATS and sensitive actions remain
accountable.

> Superseded/extended by ADR-0053 for the unified `@figentra/observability` package, Pino runtime logging, Worker logging, and web/native Stackra logging boundaries.
