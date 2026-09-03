# ADR-0013 — Transactional Outbox Where Atomic Publication Is Required

**Status:** ACCEPTED

## Decision

Database-backed services use an outbox pattern where state change and event
publication must be atomic.

## Consequence

Events can be retried safely and consumers must be idempotent.
