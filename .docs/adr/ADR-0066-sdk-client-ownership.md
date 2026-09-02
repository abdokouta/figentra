# ADR-0066 — Contracts and Service-to-Service Client Ownership

**Status:** Accepted

## Decision

`@stackra/contracts` is the canonical shared contract boundary for service-to-service
communication. It owns framework-neutral interfaces, DTOs, enums, types, event
contracts, and other wire-level shapes.

A monolithic `@figentra/sdk` is intentionally **not** part of the platform.

Transport primitives remain adapter-owned. `packages/areview/messaging` owns
transport adapters such as NATS; HTTP clients remain consumer-local until a
shared transport package is justified.

Service-specific clients remain close to the consuming service. A consumer may
compose `@stackra/network` + `@stackra/contracts` into a small local adapter when
that improves readability. A dedicated reusable SDK package is created only when
an API has a stable external consumer base or genuinely complex client behavior
that warrants independent versioning.

The Gateway therefore owns its service adapters under `services/gateway/src`.
Those adapters consume shared contracts and the foundational network transport;
they do not duplicate low-level fetch/retry/authentication machinery.

## Layering

```text
@stackra/contracts
  interfaces / DTOs / enums / types / event contracts
             ↓
transport adapter
  HTTP / NATS / queue transport concerns
             ↓
consumer-local adapter
  IAM / Identity / Registry / Tenant / ...
             ↓
remote service
```

## Consequences

- There is one canonical contract package.
- There is no platform-wide service SDK barrel containing every service.
- Service-specific clients do not become a hidden second domain layer.
- Gateway and other consumers can still have typed, testable adapters.
- External/public SDKs remain possible later without coupling internal services to
  that distribution model.
