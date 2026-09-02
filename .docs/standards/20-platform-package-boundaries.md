# Platform Package Boundaries

## Purpose

`packages/` contains reusable platform libraries and framework adapters. It does
not contain business/domain modules that belong to deployable services.

### `@stackra/contracts`

The canonical zero-business-logic wire contract package. It contains interfaces,
DTOs, enums, types, event contracts, DI tokens, and other framework-neutral
vocabulary shared across service boundaries.

Contracts do not perform HTTP, NATS, Redis, database, authentication, or workflow
execution.

### `packages/areview/*`

These are reusable platform/runtime libraries, not service SDKs:

- `workflows` — workflow DSL, discovery, client, and Cloudflare adapter
- `registry` — Registry producer/discovery integration
- `queue` — queue abstraction and BullMQ adapter for Node workloads
- `events` — event schemas and event vocabulary
- `messaging` — transport adapters such as NATS
- `outbox` — transactional outbox primitives
- `observability` — cross-cutting observability integration
- `security` — reusable security primitives

A service owns its business modules and composes these libraries.

### Service-to-service communication

The default internal pattern is:

```text
@stackra/contracts
      ↓
consumer-local adapter
      ↓
HTTP / NATS / other transport
      ↓
remote service
```

Do not create a platform-wide SDK containing clients for every internal service.
A dedicated reusable SDK is justified only for a stable external consumer base or
when a client has enough independent behavior to warrant its own versioning.

### IAM and Identity

`services/iam` and `services/identity` remain deployable services. They are not
`packages/iam` or `packages/identity` unless a future requirement creates a
framework-neutral reusable client/library with an independently versioned API.

### Config packages

The repository configuration packages live under `packages/config/*`:

- `oxlint-config`
- `prettier-config`
- `tsup-config`
- `typescript-config`

The workspace explicitly includes both `packages/areview/*` and
`packages/config/*`.
