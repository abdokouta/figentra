# `kafka` — infrastructure module

> **Category:** messaging · **Maturity:** beta · **Version:** 1.0.0

Apache Kafka persistent event log. Provisions topics + consumer groups via
Confluent Cloud (prod) or Docker-based Kafka (local dev). Suitable for
high-throughput, ordered, replayable event streams.

## Provides

- `messaging.kafka`
- `messaging.kafka.topic`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** compose.yaml
- **wrangler:** n/a

## Environment variables

| Variable               | Description                      | Source                         |
| ---------------------- | -------------------------------- | ------------------------------ |
| `KAFKA_BROKERS`        | Comma-separated broker URL list. | `terraform_output.brokers_url` |
| `KAFKA_CONSUMER_GROUP` | Consumer group name.             | `module.config.consumer_group` |
| `KAFKA_TOPICS`         | Comma-separated topic names.     | `module.config.topics[].name`  |
| `KAFKA_SSL_ENABLED`    | Whether TLS is enabled.          | `module.config.ssl`            |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: kafka
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
