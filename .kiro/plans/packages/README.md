# Package Plans

This is the **only canonical package-plan namespace**. The complete target list is maintained in [`INDEX.md`](./INDEX.md).

```text
packages/
├── base/          # foundational runtime-neutral infrastructure and contracts
├── capabilities/  # genuinely reusable cross-context SDK capabilities only
├── runtime/       # runtime adapters/integrations
└── ui/            # cross-platform UI capabilities
```

## Canonical package set

Base: contracts, container, support, errors, config, logger, observability, storage, cache, database, orm, schema, pagination, state-machine, pipeline, http, nats, realtime, link.

Capabilities: identity, tracking.

Runtime: node, nestjs, browser, react, react-native, desktop, worker.

UI: router, navigation, i18n, theming, ui.

## Non-negotiable ownership rules

- One canonical plan per target package.
- No duplicate package plans under `.kiro/plans/` root.
- Business/domain implementations live in `services/<service>/src/modules`.
- Service background work normally runs as a worker/consumer role of the owning service; do not mirror it under `workers/<service>`.
- Cross-service consumers depend on versioned `@stackra/contracts`, never another service's implementation.
- Superseded architecture is removed rather than retained as a competing target.
- Compatibility code exists only for an explicit migration boundary with an expiry/removal gate.
- `@stackra/identity` is the reusable identity/authentication SDK; there is no standalone `@stackra/auth` target.
- `@stackra/observability` owns OpenTelemetry, metrics, traces and telemetry context; `@stackra/logger` owns structured logging.
- Audit is service-owned; Analytics, Marketing and Notifications are service-owned business contexts.

## Package admission test

Before adding a package, prove that the implementation is reused by multiple bounded contexts/runtimes and does not own a business bounded context. If code primarily implements one service's business rules, it belongs inside that service.

All package plans follow `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`.
