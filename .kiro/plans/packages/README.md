# Package Plans

Package plans are grouped by architectural role and preserve the existing detailed implementation plans as the source of truth.

```text
packages/
├── base/          # foundational primitives
├── capabilities/  # reusable business/platform capabilities
└── runtime/       # runtime-specific adapters and integrations
```

Contracts remain centrally owned by `@stackra/contracts`. Package plans must follow the Enterprise Day-One Plan Standard and may not introduce target shims, deferred architecture, or duplicate canonical ownership.

Existing flat package plans are being relocated here without weakening their implementation detail.
