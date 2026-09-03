# Figentra — 12-Month Architecture & Implementation Plan

This directory is the canonical planning surface for the Figentra monorepo/framework.

## Planning rules

- Plans describe production-ready architecture, not placeholders or deferred redesigns.
- Contracts are owned centrally by `@stackra/contracts`.
- Dependency direction is contracts → foundation → capabilities → runtime adapters → applications.
- Runtime-neutral core packages must not import framework/runtime globals.
- Storage and cache are distinct concerns; filesystem and object storage remain separate adapters where appropriate.
- Database owns connectivity/transactions; ORM owns mapping/repositories/unit-of-work behavior.
- Discovery finds metadata; registries own storage/indexing; populators perform population; factories construct instances; adapters translate boundaries.
- Request scope is explicit and context-bound; no hidden ambient global request state.
- Security, observability, failure recovery, conformance tests, and public exports are implementation requirements, not follow-up work.
- Existing repository plans are preserved and treated as the package-level source of truth; this master plan reconciles cross-package policy and records the canonical architecture.

## Canonical package map

```text
packages/
├── base/
│   ├── contracts
│   ├── container
│   ├── support
│   ├── errors
│   ├── config
│   ├── logger
│   ├── storage
│   ├── cache
│   ├── database
│   ├── orm
│   ├── schema
│   ├── pagination
│   ├── state-machine
│   ├── pipeline
│   ├── http
│   ├── nats
│   ├── realtime
│   └── link
├── capabilities/
│   ├── events
│   ├── identity
│   ├── auth
│   ├── queue
│   ├── sync
│   ├── search
│   ├── media
│   ├── notifications
│   ├── workflow
│   ├── query
│   └── state
├── runtime/
│   ├── node
│   ├── nestjs
│   ├── browser
│   ├── react
│   ├── react-native
│   ├── desktop
│   └── worker
└── ui/
    ├── router
    ├── navigation
    ├── i18n
    ├── theming
    ├── tracking
    └── ui
```

## Dependency law

```text
@stackra/contracts
        ↓
container / errors / support / config
        ↓
logger / storage / cache / database / schema / pipeline
        ↓
orm / http / nats / realtime / pagination / state-machine / link
        ↓
capabilities
        ↓
runtime adapters + UI
        ↓
applications
```

Forbidden architectural regressions include ORM-owned DB connection policy, routing in link/error packages, cache pretending to be durable storage, and framework dependencies leaking into runtime-neutral cores.

## Cross-package requirements

Every package plan must define:

1. public API and explicit export map
2. internal file/module layout
3. contracts and DI tokens
4. lifecycle and request-scope behavior
5. configuration and validation
6. runtime adapters/subpaths
7. error taxonomy and safe serialization
8. observability hooks and metrics
9. retries/timeouts/cancellation/idempotency policy
10. security and redaction rules
11. unit/integration/contract/conformance/runtime tests
12. compatibility and migration rules
13. documentation/examples
14. release/versioning/changelog requirements

## Storage reconciliation

The canonical storage capability is `@stackra/storage`, with four distinct contract families:

- `KeyValueStore`
- `SecureStorage`
- `FileSystemStorage`
- `ObjectStorage`

The repository may retain a dedicated `@stackra/file-system` implementation package or internal adapter where that separation is operationally useful, but the architectural vocabulary is centralized through `@stackra/storage` contracts. Cache must not be used as durable storage.

## Existing plan inventory

The repository already contains dated package plans for core packages and infrastructure. Do not replace a stronger existing plan with a shorter duplicate. Enhance or reconcile in place, then keep one canonical implementation plan per package.

## Definition of done

A plan is implementation-ready only when an engineer can create the package without inventing architecture during coding. It must contain concrete interfaces/types, dependency rules, adapter boundaries, file-level structure, test obligations, acceptance criteria, and migration/release constraints.

## Related repository ADRs

The package plans must remain aligned with the repository’s ADR set under `.docs/adr`, especially decisions governing contracts, identity, transport, NATS, worker runtime, package standardization, and service boundaries.
