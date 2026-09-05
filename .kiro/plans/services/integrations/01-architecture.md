---
status: canonical
component: service
service: integrations
version: v1
runtime: nestjs
---
# Integrations Service — Architecture

## 1. Mission
Integrations is the external-system connectivity control plane. It provides a secure, durable boundary between Figentra and third-party systems. It owns provider adapters, tenant connections, credential references, webhook ingestion, outbound requests, synchronization, mapping and reconciliation orchestration.

It answers: **how does Figentra securely connect to an external system and keep that connection reliable?**

## 2. Boundary

| Concern | Owner |
|---|---|
| User authentication / identity providers | Identity |
| Authorization | IAM |
| Tenant ownership | Tenant |
| External business-system integrations | Integrations |
| Business meaning / authoritative domain data | Domain service |
| Notification delivery | Notifications |
| Audit evidence | Audit |

### Authentication-provider distinction
Clerk and Supabase are **Identity providers**, not generic Integrations providers. Identity owns the authentication-provider adapter boundary.

Integrations may connect to an external system that happens to expose identity-related APIs, but it must not become the authority for authentication, sessions, principals or authorization. No business service imports Clerk/Supabase SDKs through Integrations.

If Figentra later supports multiple authentication providers, the provider implementations belong under Identity:

```text
services/identity/src/infrastructure/providers/
├── supabase/
└── clerk/          # only if approved later
```

The day-one production provider remains Supabase Auth; Clerk is not required for the Integrations service.

## 3. Provider model

An Integration Provider is an adapter for a specific external system. It declares supported API version, resources, operations, authentication mechanism, pagination, rate limits, webhook verification, idempotency and data classification.

Provider SDK types are adapter-local. The rest of the service sees stable Figentra contracts.

## 4. Connection model

A tenant can have one or more connections to a provider. Connection state and external account identifiers belong to Integrations. Credential values remain in the secret manager; PostgreSQL stores only references and metadata.

## 5. Webhook model

```text
external provider
 → webhook ingress
 → authenticity verification
 → schema/size validation
 → deduplication
 → durable webhook record
 → outbox/consumer
 → mapping
 → owning domain command/event
```

Unverified events never reach domain services. Replay reuses the original verified envelope and cannot bypass deduplication.

## 6. Synchronization

Sync is explicit, resumable and idempotent. Cursor/checkpoint state is owned by Integrations. Business records remain owned by domain services. Integrations never writes another service's database.

## 7. Reconciliation

Reconciliation detects declared external/internal drift. Automatic repair is permitted only for explicitly idempotent operations. Otherwise the service creates a repair proposal/task for the responsible domain workflow/operator.

## 8. Runtime

```text
api       → integration/connection administration
consumer  → webhook/event ingestion
worker    → sync/reconciliation
scheduler → polling and due sync execution
```

All roles use the same NestJS service source tree.

## 9. Security

Outbound traffic is TLS-only, destinations are constrained, dynamic URL requests are SSRF-protected, OAuth state/nonce is validated, webhook signatures and replay windows are enforced, credentials are redacted, and provider scopes use least privilege.

## 10. Reliability

Provider calls have connect/read/overall deadlines. Retries occur only when operation semantics permit safe retry. Rate limits use provider-specific backoff. Webhook and sync processing is at-least-once with durable idempotency and DLQ isolation.

## 11. Dependencies

- `@stackra/contracts` — cross-service/provider-neutral contracts
- `@stackra/http` — bounded HTTP transport
- `@stackra/events` / NATS — durable asynchronous transport
- `@stackra/database` / `@stackra/orm` — local state
- secret manager — credentials
- Identity — authenticated administration context
- IAM — authorization
- Tenant — tenant validation
- Files — large payload/archive objects

## 12. Acceptance criteria

- No external SDK leaks outside adapters.
- No Integrations database writes another service's data.
- Webhooks are verified, deduplicated and replayable.
- Sync is resumable and idempotent.
- Provider credentials never enter ordinary database rows or telemetry.
- Authentication remains owned by Identity, even when an external identity provider is involved.
