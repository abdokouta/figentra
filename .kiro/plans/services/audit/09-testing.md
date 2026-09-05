# Audit Service — Testing Contract

Unit: canonical serialization, hash-chain calculation, append-only invariants, retention eligibility, legal-hold rules, filter AST and export state machine.

Integration: PostgreSQL append transactions, outbox, NATS ingestion, deduplication, archive/export storage and integrity checks.

Contract: event envelope/schema compatibility, OpenAPI filters/exports, audit request authorization and `@stackra/contracts` versions.

Security: forged producer, tenant escape, record mutation attempts, hash tampering, legal-hold bypass, export leakage, restricted-field exposure and privilege escalation.

E2E: emit domain security event → ingest → durable record → query → integrity check → authorized export → retention/hold behavior.

Reliability: duplicate events, out-of-order events, NATS outage, DB failure, export destination outage, worker crash, partial archive, ambiguous delete and DLQ recovery.

Load: high-rate ingestion, indexed queries and concurrent exports with p95/p99 and storage-growth limits.

Recovery/migration: restore database and chain continuity; rolling schema compatibility; no historical rewrite.