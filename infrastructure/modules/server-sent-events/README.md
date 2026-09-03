# `server-sent-events` — infrastructure module

> **Category:** realtime · **Maturity:** beta · **Version:** 1.0.0

Server-Sent Events (SSE) one-way push channel. Runtime-config module that
declares the SSE endpoint path and heartbeat interval. No separate
infrastructure — the deployable's HTTP server emits the event stream.

## Provides

- `realtime.sse`

## Runtime targets

- **terraform:** n/a
- **docker:** n/a
- **wrangler:** n/a

## Environment variables

| Variable                    | Description          | Source                                |
| --------------------------- | -------------------- | ------------------------------------- |
| `SSE_PATH`                  | SSE stream endpoint. | `module.config.path`                  |
| `SSE_HEARTBEAT_INTERVAL_MS` | Keep-alive interval. | `module.config.heartbeat_interval_ms` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: server-sent-events
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) —
  module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md)
  — authorising plan.
