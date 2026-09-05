# Tenant Service — Testing Contract

Unit: lifecycle state machine, key/hostname normalization, membership invariants, settings schema, optimistic versioning and context resolution.

Integration: PostgreSQL migrations/transactions, outbox publication, NATS duplicate delivery, domain verification adapter, cache invalidation and Identity/IAM contract behavior.

Contract: OpenAPI, event schemas, tenant-context contract and `@stackra/contracts` compatibility.

Security: cross-tenant access, forged tenant context, unauthorized lifecycle changes, membership escalation, domain challenge replay/takeover, settings injection and race conditions.

E2E: create tenant → activate → organization → membership → domain verification → settings; suspend/archive restrictions; restore/recovery behavior.

Reliability: database timeout/deadlock, NATS outage, provider/DNS timeout, duplicate events, worker crash, scheduler duplication, cache outage and DLQ recovery.

Load: concurrent tenant context resolution, membership administration, domain verification bursts and lifecycle mutations with production p95/p99 targets.

Migration: rolling upgrade compatibility, expand/contract and recovery tests.