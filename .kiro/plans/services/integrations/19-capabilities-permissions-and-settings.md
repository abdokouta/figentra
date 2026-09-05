---
status: canonical
document: service-capabilities-permissions-settings
service: integrations
version: v1
---
# Integrations Service — Capabilities, Permissions and Settings Catalog

## Capabilities
`integrations.catalog.read`, `integrations.connection.manage`, `integrations.authorization.manage`, `integrations.webhook.ingest`, `integrations.sync.execute`, `integrations.mapping.manage`, `integrations.reconciliation.execute`, `integrations.provider.health`.

## IAM permission keys
- `integrations.read`
- `integrations.connection.read`, `integrations.connection.create`, `integrations.connection.update`, `integrations.connection.authorize`, `integrations.connection.revoke`
- `integrations.sync.read`, `integrations.sync.execute`, `integrations.sync.cancel`
- `integrations.mapping.read`, `integrations.mapping.create`, `integrations.mapping.update`, `integrations.mapping.publish`
- `integrations.reconciliation.read`, `integrations.reconciliation.execute`
- `integrations.provider.status.read`
- `integrations.webhook.admin` for tightly controlled diagnostic/replay operations, never ordinary webhook delivery

Resource types: `integration-definition`, `integration-connection`, `integration-mapping`, `sync-job`, `reconciliation-job`, `webhook-event`. Permission keys are immutable and route/application-command mapped.

## Provider capability catalog
Each provider declares: authorization methods; inbound webhook event types; outbound operations; sync entities/directions; pagination model; rate-limit model; idempotency support; incremental cursor support; reconciliation capability; configuration schema; credential reference schema; egress hosts; API/webhook version. Provider capability absence is explicit and cannot be emulated silently.

## Connection settings
Tenant connection configuration is schema-controlled per provider, versioned and authorized. Non-secret fields may include account/workspace/resource selectors and sync choices. Secret credentials are always references. Arbitrary provider configuration keys are rejected.

## Operational settings
Provider timeouts/retry/circuit/rate concurrency, webhook limits/tolerance/dedupe, sync/reconciliation batch/checkpoint/cadence, mapping limits, egress/redirect policy, idempotency retention, credential refresh windows, notification/realtime limits and Registry/OTel settings are typed with safety bounds.

## Registry
Registry receives capabilities, permissions/resources, provider capability/config schemas, route mappings and operational setting metadata. It receives neither tenant connection values nor credentials/tokens/webhook payloads.

## Tests
CI enforces provider key/capability uniqueness, route-to-permission coverage, provider config schema/version compatibility, no auth-provider registration, egress allowlist completeness, safe setting ranges and Registry projection consistency.