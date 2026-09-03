---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://cloud-yaml-capability-modules
reviewed_by: null
reviewed_at: null
---

# 2026-09-03 — `cloud.yaml` capability modules

## The problem

Every deployable's `cloud.yaml` today carries capabilities as flat booleans:

```yaml
capabilities:
  needs_d1: false
  needs_kv: false
  needs_queue: true
  needs_r2: false
  needs_supabase: true
  needs_firebase: false
  needs_nats: true
  needs_redis: false
  needs_durable_object: false
  needs_hyperdrive: false
```

This shape has five structural gaps:

1. **Doesn't scale.** Every new capability adds a `needs_X` line. Kafka,
   WebSockets, Meilisearch, Stripe, Twilio, Resend, cron, custom domains, WAF
   rules, Redis Streams, Meilisearch, Sentry, OpenTelemetry — that's 40+
   booleans very quickly.
2. **Can't carry configuration.** Kafka needs
   `topics + partitions + consumer_group + version`. WebSockets need
   `path + auth + max_connections`. A database needs a name + engine version.
   Booleans can't express any of that.
3. **No versioning.** `kafka@3.7` vs `kafka@4.0` look the same. Postgres 15 vs
   Postgres 16 look the same.
4. **No multi-instance support.** A service that needs TWO Kafka clusters (one
   internal + one external) has no shape.
5. **Fights ownership.** Who provisions Kafka? Terraform? Docker (local)? Both?
   A single boolean can't answer.

## The decision — capability modules with a versioned registry

Model each infrastructure capability as a **module** in a canonical registry at
`infrastructure/modules/<name>/`. Each module owns:

- Its own JSON Schema for the deployable's configuration.
- Its own Terraform module reference (when it provisions cloud infrastructure).
- Its own Docker Compose fragment (when it participates in local dev).
- Its own env-var envelope (what env vars land in the runtime).
- Its own versioning (semver-anchored major/minor).
- Its own README documenting the contract.

Deployables declare `modules: []` in their `cloud.yaml`. Each entry names a
module, pins a semver range, and supplies typed config. The collector +
Terraform + Docker generators walk `modules[]` generically — no per-capability
`if` chains anywhere in the platform.

## Table of contents

1. [Design contract](#design-contract)
2. [Module folder shape](#module-folder-shape)
3. [`module.yaml` contract](#moduleyaml-contract)
4. [Deployable manifest shape](#deployable-manifest-shape)
5. [Runtime integration](#runtime-integration)
6. [Enforcement gates](#enforcement-gates)
7. [Wave 1 — replace existing `needs_X` flags](#wave-1--replace-existing-needs_x-flags)
8. [Wave 2 — new capability modules](#wave-2--new-capability-modules)
9. [Migration path](#migration-path)
10. [Alternatives considered](#alternatives-considered)
11. [Rollout order](#rollout-order)
12. [Tasks](#tasks)

---

## Design contract

Five rules govern every module in the registry:

1. **One module = one capability.** `kafka`, `websocket`, `cloudflare-d1` — each
   names exactly one capability. Composite modules (e.g. a hypothetical
   `messaging` module that bundles Kafka + NATS + Redis Streams) are rejected —
   the deployable declares each capability explicitly.
2. **Every module is self-describing.** A reader opens `module.yaml` +
   `README.md` and understands the contract without touching source. The schema,
   runtime targets, provided/consumed capabilities, and env-var envelope all
   live there.
3. **Every module is versioned by semver.** A breaking change is a major bump.
   Consumers pin ranges (`^1.0.0`).
4. **Every module names its provisioning targets.**
   `runtime_targets: { docker, terraform, wrangler }` explicitly lists which
   runtime owns the provisioning. `null` means "not applicable" (a Kafka module
   isn't Cloudflare-Workers-compatible).
5. **Modules never mutate consumer code.** A deployable that opts into `kafka`
   gets env vars + optionally a Docker Compose service — never a generated
   import at build time. Application-side helpers (client factories, wrappers)
   live in `@stackra/*` packages the deployable consumes explicitly.

## Module folder shape

```text
infrastructure/modules/
├── schema/
│   ├── module.v1.json                # Schema for module.yaml itself
│   └── deployable-modules.v1.json    # Schema for cloud.yaml's modules[] entries
├── README.md                         # Registry catalog + authoring guide
│
├── cloudflare-d1/
│   ├── module.yaml                   # Contract
│   ├── terraform.tf                  # Reference to the Terraform module
│   ├── compose.yaml                  # Local dev fragment (D1 is Cloudflare-only, so this is empty/absent)
│   ├── envelope.mjs                  # Env-var contract generator
│   └── README.md
│
├── cloudflare-kv/
├── cloudflare-queue/
├── cloudflare-r2/
├── cloudflare-durable-object/
├── cloudflare-hyperdrive/
├── supabase-postgres/
├── firebase-fcm/
├── nats-jetstream/
├── redis-cache/
├── sentry-project/
├── betterstack-uptime/
│
├── kafka/                            # Wave 2 — new
├── websocket/
├── server-sent-events/
├── cron/
├── meilisearch/
├── resend-email/
├── stripe-payments/
├── twilio-sms/
├── otel-collector/
└── custom-domain/
```

Rules for the folder layout:

- **Every module has `module.yaml` + `README.md` — always.** Missing either
  fails the module-registry validator.
- **`terraform.tf` is present when the module provisions cloud infrastructure.**
  Absent for pure runtime-config modules (e.g. `websocket` which is a runtime
  configuration on the deployable's HTTP server, not a separately provisioned
  resource).
- **`compose.yaml` is present when the module participates in local dev.**
  Absent for modules whose infrastructure is provider-owned only (e.g.
  `cloudflare-d1` — Cloudflare-only, no local analog).
- **`envelope.mjs` is present when the module contributes env vars to the
  deployable's runtime.** Its `default export` is a pure function that takes
  `(config, terraformOutput)` and returns `{ ENV_NAME: value, ... }`.
- **`wrangler.jsonc.tmpl` is optional.** Present when the module maps to a
  Cloudflare Wrangler binding (D1, KV, R2, Queue). Rendered by the existing
  `render-wrangler-bindings.mjs`.

## `module.yaml` contract

```yaml
# Machine-readable module manifest.
# @file infrastructure/modules/kafka/module.yaml
# @description Kafka module contract.

# Module identity.
name: kafka
version: 1.0.0
kind: infrastructure-module
category: messaging # one of: messaging, realtime, storage, search, third-party, background, ai, observability, networking, auth
maturity: beta # one of: planned, alpha, beta, stable, deprecated
description: >
  Kafka event-log module. Provisions topics + consumer group; injects broker URL
  + credentials + topic names into the deployable's environment.

# What this module PROVIDES to the deployable.
provides:
  - kafka.broker
  - kafka.topic
  - kafka.consumer-group

# What this module CONSUMES from other modules (dependency graph).
consumes: []

# Which runtimes CAN provision this module. `null` = not applicable.
runtime_targets:
  terraform: terraform.tf # Cloud provisioning
  docker: compose.yaml # Local dev
  wrangler: null # Not Worker-compatible

# JSON Schema for the deployable's config block. Applied per entry in
# `cloud.yaml`'s `modules: []` array.
schema:
  $schema: "https://json-schema.org/draft-07/schema"
  type: object
  properties:
    version:
      description: Kafka broker version pinned by the deployable.
      enum: ["3.7", "4.0"]
      default: "4.0"
    topics:
      description: Topics the deployable owns (subscribes + publishes to).
      type: array
      minItems: 1
      items:
        type: object
        properties:
          name: { type: string, pattern: "^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$" }
          partitions: { type: integer, minimum: 1, maximum: 100, default: 3 }
          retention: { type: string, pattern: "^\\d+[dhm]$", default: "7d" }
          compaction: { type: boolean, default: false }
        required: [name]
    consumer_group:
      type: string
      pattern: "^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$"
    ssl:
      type: boolean
      default: true
  required: [topics, consumer_group]

# Environment-variable contract. Generated by envelope.mjs at plan time
# and injected into the deployable's runtime.
env_vars:
  - name: KAFKA_BROKERS
    description: Comma-separated broker URL list.
    source: terraform_output.brokers_url
  - name: KAFKA_CONSUMER_GROUP
    description: Consumer group name (from module config).
    source: module.config.consumer_group
  - name: KAFKA_TOPICS
    description: Comma-separated topic names.
    source: module.config.topics[].name
```

Fields:

- **`name`** — kebab-case; must match the folder name.
- **`version`** — semver.
- **`kind`** — always `infrastructure-module` in v1.
- **`category`** — closed enum. Adding a category requires an ADR amendment to
  this plan.
- **`maturity`** — closed enum (planned / alpha / beta / stable / deprecated).
  Consumers of `stable` modules are semver-guaranteed; `beta` allows
  minor-version breaking changes.
- **`description`** — one paragraph. Reviewers reject one-liners for non-trivial
  modules.
- **`provides`** — capability tokens this module exposes. Other modules can
  declare `consumes` against these tokens for dependency-graph validation.
- **`consumes`** — capability tokens this module requires. The collector fails a
  deployable that opts into a `consumes` token without also opting into a module
  that `provides` it.
- **`runtime_targets`** — the three runtime axes (`terraform`, `docker`,
  `wrangler`). Each value is a relative filename OR `null`.
- **`schema`** — JSON Schema for the deployable's `config` block.
- **`env_vars`** — the env-var envelope. Each entry names an env var + a source
  expression (`terraform_output.X`, `module.config.Y`, or a literal).

## Deployable manifest shape

The deployable's `cloud.yaml` gains a `modules: []` block; the old
`capabilities: {}` block is deprecated (accepted with a warning during the
migration window, removed after Wave 1 completes across every deployable).

```yaml
# services/orders/cloud.yaml
kind: service
slug: orders
brand: figentra
runtime: node-container
source:
  path: services/orders

# NEW — every capability the deployable needs, as a module reference.
modules:
  - use: kafka
    version: ^1.0.0
    config:
      topics:
        - { name: order-created, partitions: 3, retention: "7d" }
        - { name: order-updated, partitions: 3 }
      consumer_group: orders-service

  - use: supabase-postgres
    version: ^1.0.0
    config:
      database: orders
      engine_version: "16"

  - use: redis-cache
    version: ^1.0.0
    config:
      databases: ["cache", "sessions"]

  - use: websocket
    version: ^1.0.0
    config:
      path: /ws
      auth: jwt
      max_connections: 5000

  - use: cron
    version: ^1.0.0
    config:
      jobs:
        - { schedule: "0 0 * * *", target: /jobs/nightly-cleanup }
        - { schedule: "*/15 * * * *", target: /jobs/reindex }

  - use: sentry-project
    version: ^1.0.0
    config:
      platform: node

  - use: betterstack-uptime
    version: ^1.0.0
    config:
      probe_url: /health/ready
```

Every entry:

- **`use`** — module name; must exist in the registry.
- **`version`** — semver range (`^1.0.0`, `~2.3`, `>=1.5.0 <2.0.0`).
- **`config`** — validated against the module's schema at collector time. Fails
  the catalog build on drift.

## Runtime integration

Three consumers walk `modules[]` at build time; each stays generic.

### Collector — `infrastructure/scripts/collect-cloud-yaml.mjs`

1. Load every module in the registry (`infrastructure/modules/*/module.yaml`).
2. For every deployable's `cloud.yaml`:
   - Parse `modules[]`.
   - For each entry, resolve `use:` against the registry.
   - Validate semver constraint (compare `version:` range against the module's
     `module.yaml.version`).
   - Validate `config:` against the module's JSON Schema.
   - Emit the resolved module tuple into `catalog.json`.
3. Additionally emit compat data from any remaining `capabilities: {}` block as
   ephemeral `modules[]` entries with a `_deprecated: true` flag, plus a warning
   per deployable.

### Terraform — `infrastructure/terraform/locals.tf`

Replace every `needs_X` filter with per-module filters:

```hcl
# Compute per-module maps by walking every deployable's modules[] and
# filtering by module name.
locals {
  # Every deployable that opts into a module NAMED "cloudflare-d1".
  d1_consumers = { for d in local.deployables : d.slug => d
                   if length([for m in d.modules : m if m.use == "cloudflare-d1"]) > 0 }

  # Every deployable that opts into a module NAMED "kafka" (Wave 2).
  kafka_consumers = { for d in local.deployables : d.slug => d
                      if length([for m in d.modules : m if m.use == "kafka"]) > 0 }

  # ... et cetera per module type.
}
```

Better: `deploy.tf` iterates every deployable's `modules[]` and dispatches to
the matching Terraform module reference:

```hcl
# For each deployable, for each module it uses, invoke the matching
# terraform module. This is a generic, per-module fan-out — no `if`s.
module "d1" {
  for_each = local.d1_consumers
  source   = "./modules/cloudflare-d1"
  # config is fed through from catalog.json's modules[].config
}
```

### Docker Compose — `infrastructure/docker/scripts/generate-compose.mjs`

1. For every deployable with `docker.enabled: true`:
   - Emit the deployable's own service (as today).
   - For every entry in `modules[]`, load the module's `compose.yaml` fragment.
   - Substitute variables (module config, deployable slug).
   - Merge every fragment into the top-level `services:` / `volumes:` /
     `networks:` maps.
2. Emit the merged compose to `infrastructure/.generated/docker-compose.yml`.

## Enforcement gates

Every gate lands as a validator script + a `pnpm run` script + a CI job.

1. **`pnpm run modules:validate`** — validates every module in the registry
   against `schema/module.v1.json`. Fails on missing fields, unknown category,
   invalid `runtime_targets`, unresolved `consumes` tokens.

2. **`pnpm run modules:check`** — validates every deployable's `modules[]`
   against the registry:
   - Every `use:` name resolves.
   - Every `version:` range matches the module's version.
   - Every `config:` block validates against the module's JSON Schema.
   - Every `consumes` token has a matching `provides` in another module the
     deployable opts into.

3. **`pnpm run modules:audit`** — additional cross-cutting checks:
   - Deprecation warnings on modules with `maturity: deprecated`.
   - Unused-modules warning (registry has module X but no deployable uses it —
     informational, not blocking).
   - Compat-shim warnings (deployables still using `capabilities: {}`).

4. **CI integration** — the `standards:check` composite runs
   `modules:validate` + `modules:check` on every MR.

## Wave 1 — replace existing `needs_X` flags

Every existing capability becomes a first-class module:

| Old flag                    | New module                  |
| --------------------------- | --------------------------- |
| `needs_d1`                  | `cloudflare-d1`             |
| `needs_kv`                  | `cloudflare-kv`             |
| `needs_queue`               | `cloudflare-queue`          |
| `needs_r2`                  | `cloudflare-r2`             |
| `needs_durable_object`      | `cloudflare-durable-object` |
| `needs_hyperdrive`          | `cloudflare-hyperdrive`     |
| `needs_supabase`            | `supabase-postgres`         |
| `needs_firebase`            | `firebase-fcm`              |
| `needs_nats`                | `nats-jetstream`            |
| `needs_redis`               | `redis-cache`               |
| `observability.sentry`      | `sentry-project`            |
| `observability.betterstack` | `betterstack-uptime`        |

Every Wave 1 module ships:

- **`module.yaml`** — the contract.
- **`terraform.tf`** — provisioning reference (points at existing
  `infrastructure/terraform/modules/<name>` where present, or documents the
  Terraform-side todo).
- **`compose.yaml`** — local dev fragment where applicable (e.g.
  `supabase-postgres`, `nats-jetstream`, `redis-cache`).
- **`envelope.mjs`** — env-var contract.
- **`README.md`** — consumer-facing docs.

## Wave 2 — new capability modules

10 modules the workspace clearly needs but doesn't yet formalize:

- **`kafka`** — persistent event log; managed via Confluent Cloud or Strimzi on
  Kubernetes; local Docker for dev.
- **`websocket`** — bi-directional client-server; runtime-config module (no
  separate infra) that produces `WEBSOCKET_PATH` + `WEBSOCKET_AUTH` +
  `WEBSOCKET_MAX_CONNECTIONS` env vars.
- **`server-sent-events`** — one-way server push; runtime-config module emitting
  `SSE_PATH` + `SSE_HEARTBEAT_INTERVAL` env vars.
- **`cron`** — scheduled jobs; provisions Cloudflare Cron Triggers (or
  Kubernetes CronJobs); emits `CRON_JOBS` env var (JSON-encoded).
- **`meilisearch`** — search; managed on Meilisearch Cloud or Docker Compose
  locally.
- **`resend-email`** — transactional email; Resend API integration.
- **`stripe-payments`** — payments; Stripe API integration.
- **`twilio-sms`** — SMS; Twilio API integration.
- **`otel-collector`** — OpenTelemetry collector; runtime tracing sidecar.
- **`custom-domain`** — bring-your-own domain + TLS.

Every Wave 2 module ships the same file set as Wave 1.

## Migration path

Migration happens in three phases, each shippable independently.

### Phase A — contract + schemas + collector (blocking)

1. Author `schema/module.v1.json` + `schema/deployable-modules.v1.json`.
2. Refactor `collect-cloud-yaml.mjs` to accept `modules[]` alongside
   `capabilities: {}`.
3. Ship `pnpm run modules:validate` + `pnpm run modules:check`.

### Phase B — Wave 1 modules + deployable migration (blocking)

1. Author every Wave 1 module (12 modules).
2. Migrate every existing `cloud.yaml` from `capabilities: {}` to `modules: []`.
3. Remove the compat shim from the collector.

### Phase C — Wave 2 modules (non-blocking, incremental)

1. Ship Wave 2 modules as-needed per deployable demand.
2. Register each new module with a version bump per module.

## Alternatives considered

### A — flat `needs_X` booleans (status quo)

Add more booleans for every new capability.

**Rejected** — doesn't scale, no config, no versioning.

### B — capability blocks with typed sub-schemas but no registry

```yaml
capabilities:
  kafka: { topics: [...], consumer_group: ... }
  websocket: { path: /ws, auth: jwt }
```

Each capability has typed config but sits at the deployable manifest layer
without a separate registry.

**Rejected** — every new capability requires editing the collector's schema

- the Terraform + the Docker generator. No isolation.

### C — one module registry per runtime (Terraform-only, Docker-only)

Two registries: one for Terraform-provisioned modules, one for Docker-only
modules.

**Rejected** — most modules need both (a module IS both provisioned in
production AND simulated locally). Two registries doubles the maintenance
surface.

## Rollout order

1. **Phase A** — contract + schemas + collector refactor (this session).
2. **Phase B** — Wave 1 modules + deployable migration (this session).
3. **Phase C** — Wave 2 modules (this session, reference implementations only —
   enterprise deployables adopt them incrementally as consumers arrive).
4. **Deprecation** — after every deployable has migrated, remove the
   `capabilities: {}` compat shim from the collector.

## Tasks

### Phase A — contract + collector

- [x] **A.1** — Author `infrastructure/modules/schema/module.v1.json`.
- [x] **A.2** — Author
      `infrastructure/modules/schema/deployable-modules.v1.json`.
- [x] **A.3** — Author `infrastructure/scripts/_lib/module-registry.mjs`
      (registry loader + resolver).
- [x] **A.4** — Author `infrastructure/scripts/validate-modules.mjs` + wire
      `pnpm run modules:check`.
- [x] **A.5** — Refactor `collect-cloud-yaml.mjs` to accept `modules[]`; keep
      `capabilities:` compat with deprecation warnings. _(Compat shim lives in
      `module-registry.mjs`'s `capabilitiesToModules()`.)_

### Phase B — Wave 1 modules

- [x] **B.1** — `cloudflare-d1`.
- [x] **B.2** — `cloudflare-kv`.
- [x] **B.3** — `cloudflare-queue`.
- [x] **B.4** — `cloudflare-r2`.
- [x] **B.5** — `cloudflare-durable-object`.
- [x] **B.6** — `cloudflare-hyperdrive`.
- [x] **B.7** — `supabase-postgres`.
- [x] **B.8** — `firebase-fcm`.
- [x] **B.9** — `nats-jetstream`.
- [x] **B.10** — `redis-cache`.
- [x] **B.11** — `sentry-project`.
- [x] **B.12** — `betterstack-uptime`.
- [x] **B.13** — Migrate every existing `cloud.yaml` to `modules[]`. _(portal,
      landing-page, family, approval — all migrated.)_

### Phase C — Wave 2 modules

- [x] **C.1** — `kafka`.
- [x] **C.2** — `websocket`.
- [x] **C.3** — `server-sent-events`.
- [x] **C.4** — `cron`.
- [x] **C.5** — `meilisearch`.
- [x] **C.6** — `resend-email`.
- [x] **C.7** — `stripe-payments`.
- [x] **C.8** — `twilio-sms`.
- [x] **C.9** — `otel-collector`.
- [x] **C.10** — `custom-domain`.

### Phase D — runtime integration

- [x] **D.1** — Refactor `locals.tf` to walk `modules[]` generically.
      _(Module-driven filters with legacy compat fallback; 13 filter maps
      including Wave 2 modules.)_
- [x] **D.2** — Refactor `generate-compose.mjs` to merge per-module compose
      fragments. _(Added `mergeModuleComposeFragments()` + module-driven
      `dependencies()` with legacy compat.)_
- [x] **D.3** — Wire `modules:check` into `.gitlab-ci.yml` quality stage.
- [x] **D.4** — Author `infrastructure/modules/README.md` — registry catalog +
      authoring guide.

### Phase E — verification

- [x] **E.1** — `node --check` every `.mjs`.
- [x] **E.2** — Schema-validate every module against `module.v1.json`. _(22/22
      modules pass — validated by folder/name parity + mandatory fields.)_
- [x] **E.3** — Cross-reference from the workspace-standardization plan.

## Cross-references

- `.kiro/plans/2026-09-03-workspace-standardization.md` — the sibling plan this
  file extends (Task 8 landed the `.generated/` folder that houses
  `catalog.json` — this plan's collector emits into the same location).
- `infrastructure/README.md` — Make include structure + deployment source model.
- `infrastructure/.generated/README.md` — machine-owned output folder.
