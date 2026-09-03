# `websocket` — infrastructure module

> **Category:** realtime · **Maturity:** beta · **Version:** 1.0.0

WebSocket bi-directional realtime channel. Runtime-config module that declares the WebSocket endpoint path, auth strategy, and connection limits. No separate infrastructure provisioned — the deployable's HTTP server handles the upgrade.

## Provides

- `realtime.websocket`

## Runtime targets

- **terraform:** n/a
- **docker:** n/a
- **wrangler:** n/a

## Environment variables

| Variable | Description | Source |
| -------- | ----------- | ------ |
| `WEBSOCKET_PATH` | WebSocket upgrade endpoint path. | `module.config.path` |
| `WEBSOCKET_AUTH` | Auth strategy. | `module.config.auth` |
| `WEBSOCKET_MAX_CONNECTIONS` | Max concurrent WS connections. | `module.config.max_connections` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: websocket
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) — module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md) — authorising plan.
