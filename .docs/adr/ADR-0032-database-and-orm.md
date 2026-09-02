# ADR-0032 — Database and ORM

## Status
Accepted.

## Decision
PostgreSQL/Supabase is the primary relational persistence platform for backend
services. D1 is used for Cloudflare-native Worker control-plane data where the
latency/deployment model is appropriate, notably the Application Registry.

MikroORM is the standard ORM for NestJS services unless a service has a
documented reason to use a different persistence technology.

Transactions are explicit and required around multi-write business operations
and transactional outbox creation.

## Consequences
Relational domain services retain PostgreSQL capabilities while Workers can use
D1 without pretending D1 is the universal application database.
