# Infrastructure Capability Modules

> **Registry path:** `infrastructure/modules/`
> **Schema:** `infrastructure/modules/schema/module.v1.json`
> **Validator:** `pnpm run modules:check`

## What is a module?

A module is a self-contained infrastructure capability that a deployable can
opt into via its `cloud.yaml` `modules[]` array. Each module owns:

- A **contract** (`module.yaml`) — machine-readable manifest with the
  capability's identity, schema, runtime targets, and env-var envelope.
- A **README** — human-readable documentation.
- Optionally: Terraform reference, Docker Compose fragment, Wrangler template,
  and an env-var envelope generator.

## Module catalog

### Cloudflare (6 modules)

| Module | Category | Maturity | Replaces |
| ------ | -------- | -------- | -------- |
| [`cloudflare-d1`](cloudflare-d1/) | cloudflare | stable | `needs_d1` |
| [`cloudflare-kv`](cloudflare-kv/) | cloudflare | stable | `needs_kv` |
| [`cloudflare-queue`](cloudflare-queue/) | cloudflare | stable | `needs_queue` |
| [`cloudflare-r2`](cloudflare-r2/) | cloudflare | stable | `needs_r2` |
| [`cloudflare-durable-object`](cloudflare-durable-object/) | cloudflare | beta | `needs_durable_object` |
| [`cloudflare-hyperdrive`](cloudflare-hyperdrive/) | cloudflare | beta | `needs_hyperdrive` |

### Storage (2 modules)

| Module | Category | Maturity | Replaces |
| ------ | -------- | -------- | -------- |
| [`supabase-postgres`](supabase-postgres/) | storage | stable | `needs_supabase` |
| [`redis-cache`](redis-cache/) | storage | stable | `needs_redis` |

### Messaging (2 modules)

| Module | Category | Maturity | Replaces |
| ------ | -------- | -------- | -------- |
| [`nats-jetstream`](nats-jetstream/) | messaging | stable | `needs_nats` |
| [`kafka`](kafka/) | messaging | beta | _(new)_ |

### Realtime (2 modules)

| Module | Category | Maturity | Replaces |
| ------ | -------- | -------- | -------- |
| [`websocket`](websocket/) | realtime | beta | _(new)_ |
| [`server-sent-events`](server-sent-events/) | realtime | beta | _(new)_ |

### Observability (3 modules)

| Module | Category | Maturity | Replaces |
| ------ | -------- | -------- | -------- |
| [`sentry-project`](sentry-project/) | observability | stable | `observability.sentry` |
| [`betterstack-uptime`](betterstack-uptime/) | observability | stable | `observability.betterstack` |
| [`otel-collector`](otel-collector/) | observability | beta | _(new)_ |

### Third-party (4 modules)

| Module | Category | Maturity | Replaces |
| ------ | -------- | -------- | -------- |
| [`firebase-fcm`](firebase-fcm/) | third-party | stable | `needs_firebase` |
| [`resend-email`](resend-email/) | third-party | beta | _(new)_ |
| [`stripe-payments`](stripe-payments/) | third-party | beta | _(new)_ |
| [`twilio-sms`](twilio-sms/) | third-party | beta | _(new)_ |

### Background (1 module)

| Module | Category | Maturity | Replaces |
| ------ | -------- | -------- | -------- |
| [`cron`](cron/) | background | beta | _(new)_ |

### Search (1 module)

| Module | Category | Maturity | Replaces |
| ------ | -------- | -------- | -------- |
| [`meilisearch`](meilisearch/) | search | beta | _(new)_ |

### Networking (1 module)

| Module | Category | Maturity | Replaces |
| ------ | -------- | -------- | -------- |
| [`custom-domain`](custom-domain/) | networking | beta | _(new)_ |

## How to use a module

In a deployable's `cloud.yaml`:

```yaml
modules:
  - use: kafka
    version: "^1.0.0"
    config:
      topics:
        - { name: order-created, partitions: 3, retention: "7d" }
      consumer_group: orders-service

  - use: sentry-project
    version: "^1.0.0"
    config:
      platform: node
```

Every `use:` name must match a folder in this directory. Every `config:` block
is validated against the module's JSON Schema at catalog-collection time.

## How to author a new module

1. **Create** `infrastructure/modules/<name>/`.
2. **Author** `module.yaml` — validate against `schema/module.v1.json`.
3. **Author** `README.md` — consumer-facing docs + usage snippet.
4. **Optionally author** `terraform.tf`, `compose.yaml`, `wrangler.jsonc.tmpl`,
   `envelope.mjs` depending on which runtime targets the module touches.
5. **Run** `pnpm run modules:check` — must pass before commit.
6. **Update** this file's catalog table with one new row.

### Naming rules

- Module name is **kebab-case** and must match the folder name exactly.
- Module `provides` tokens are **dotted lowercase** (e.g. `messaging.kafka`).
- Module `env_vars` use **SCREAMING_SNAKE_CASE** (e.g. `KAFKA_BROKERS`).

### Versioning

- **Patch** — docblock fixes, README updates, non-breaking schema additions
  (new optional field).
- **Minor** — new optional env var, new optional config field.
- **Major** — renamed env var, removed config field, changed default, schema
  breaking change.

## Enforcement

- `pnpm run modules:check` — validates registry + every deployable's `modules[]`.
- CI: `modules:check` job runs in the `quality` stage on every merge request.
- Reviewers reject `cloud.yaml` changes that use the legacy `capabilities:{}`
  block — every capability must be a module reference.

## Cross-references

- [`schema/module.v1.json`](schema/module.v1.json) — module manifest schema.
- [`schema/deployable-modules.v1.json`](schema/deployable-modules.v1.json) —
  deployable `modules[]` schema.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md) —
  authorising plan.
- [`infrastructure/README.md`](../README.md) — infrastructure overview.
