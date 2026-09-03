# Package Plans

This is the **only canonical package-plan namespace**.

```text
packages/
├── base/          # foundational runtime-neutral infrastructure and contracts
├── capabilities/  # reusable platform capabilities
├── runtime/       # runtime adapters/integrations
└── ui/            # cross-platform UI capabilities
```

## Non-negotiable ownership rules

- One canonical plan per target package.
- No duplicate package plans under `.kiro/plans/` root.
- Superseded architecture is removed rather than retained as a competing target.
- Compatibility code exists only for an explicit migration boundary with an expiry/removal gate.
- `@stackra/identity` owns authentication and identity; there is no standalone `@stackra/auth` target.
- `@stackra/observability` owns OpenTelemetry, metrics, traces and telemetry context; `@stackra/logger` owns logging.
- `@stackra/audit` is the canonical audit capability; its durable service and asynchronous worker are separate deployment boundaries.
- Tracking, analytics, marketing, notifications, events, usage and audit remain separate ownership boundaries.

Existing detailed plans must be relocated into these namespaces without weakening their implementation contracts. New plans must follow the Enterprise Day-One Plan Standard.