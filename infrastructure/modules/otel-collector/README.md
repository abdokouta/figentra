# `otel-collector` — infrastructure module

> **Category:** observability · **Maturity:** beta · **Version:** 1.0.0

OpenTelemetry Collector sidecar for distributed tracing. Provisions an OTel
Collector (Docker sidecar locally, managed exporter in prod) that receives OTLP
traces/metrics and forwards them to the configured backend (Grafana Tempo,
Jaeger, Datadog).

## Provides

- `observability.tracing`
- `observability.otel`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** compose.yaml
- **wrangler:** n/a

## Environment variables

| Variable                      | Description                   | Source                           |
| ----------------------------- | ----------------------------- | -------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTel Collector OTLP endpoint. | `terraform_output.otel_endpoint` |
| `OTEL_SERVICE_NAME`           | Service identity for traces.  | `deployable.slug`                |
| `OTEL_TRACES_SAMPLER_ARG`     | Sampling ratio.               | `module.config.sampling_ratio`   |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: otel-collector
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
