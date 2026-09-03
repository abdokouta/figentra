---
authored_by: kiro
authored_at: 2026-09-03
status: Planned
---

# Audit Service — implementation plan

## Purpose

Deployable NestJS bounded context responsible for durable audit records, tenant-isolated query/control APIs, compliance export, retention policy execution, and integrity verification.

## Boundary

Owns audit persistence and read models. It consumes canonical `@stackra/audit` contracts and does not own logging, telemetry, analytics, authorization policy, or notification delivery.

## APIs

- Query audit records with tenant/resource/actor/action/time filters.
- Retrieve a single immutable audit record.
- Export authorized audit ranges.
- Verify integrity for a range or record chain.
- Report retention/archive status.

All APIs require authenticated principal/actor context and IAM/policy authorization.

## Persistence

Use the canonical database/ORM stack. Audit records are append-only after finalization. Indexes support tenant, actor, resource, action, timestamp, correlation ID, and integrity verification. Retention/archival policies are explicit and migration-safe.

## Reliability

Reads remain available during worker ingestion lag. Duplicate event delivery is idempotent. The service exposes health/readiness and dependency status without exposing secrets or payloads.

## Observability

Use `@stackra/logger` + `@stackra/observability`; include correlation/request/trace IDs and audit IDs. Never emit full sensitive audit payloads to operational telemetry.

## Testing

API authorization, tenant isolation, pagination, immutable semantics, idempotent writes, integrity verification, export controls, migration compatibility, concurrency, and failure tests.

## Implementation phases

1. NestJS service scaffold and configuration.
2. Domain/application contracts and persistence.
3. Query/export APIs and IAM integration.
4. Integrity, retention, archival, and reconciliation.
5. Observability, security hardening, load/failure testing.
