# Figentra Application Registry

The Application Registry is the authoritative **control-plane inventory** for
deployable applications and their discoverable platform metadata. It is
metadata-only: it does not own business-domain records or executable workflow
code. D1 is authoritative; KV is cache-only.

## Day-one category inventory

| Category      | Storage/API                                        | Producer                                      | Purpose                                                    |
| ------------- | -------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| applications  | `applications`                                     | every deployable                              | identity, status, branding, metadata                       |
| versions      | `application_versions`                             | every release                                 | immutable release manifest + content hash                  |
| environments  | `application_environments`                         | deployment pipeline                           | development/staging/production targets                     |
| capabilities  | `application_capabilities`                         | application manifest                          | runtime/platform capability inventory                      |
| modules       | `application_modules`                              | `RegistryModule.forFeature()` / discovery     | bounded application modules                                |
| resources     | `application_resources`                            | `RegistryModule.forFeature()` / discovery     | addressable resources                                      |
| actions       | `application_actions`                              | `RegistryModule.forFeature()` / discovery     | operations + permission mapping                            |
| routes        | `application_routes`                               | gateway integration                           | route resolution metadata                                  |
| navigation    | `application_navigation`                           | `RegistryModule.forFeature()` / discovery     | UI navigation inventory                                    |
| events        | `application_catalog_items(category=event)`        | `@RegistryEvent()` / `forFeature()`           | event contracts/topics                                     |
| workflows     | `application_catalog_items(category=workflow)`     | `@RegistryWorkflow()` / `@figentra/workflows` | workflow identity, runtime target, triggers and policy     |
| integrations  | `application_catalog_items(category=integration)`  | `@RegistryIntegration()`                      | external integration inventory                             |
| settings      | `application_catalog_items(category=setting)`      | `@RegistrySetting()`                          | public/configurable setting metadata; never values/secrets |
| features      | `application_catalog_items(category=feature)`      | `@RegistryFeature()`                          | feature exposure metadata                                  |
| widgets       | `application_catalog_items(category=widget)`       | `@RegistryWidget()`                           | UI/SDUI widget inventory                                   |
| localization  | `application_catalog_items(category=localization)` | `@RegistryLocalization()`                     | locale/namespace inventory                                 |
| registrations | `registrations`                                    | Registry API                                  | idempotency + content hash                                 |
| audit         | `audit_log`                                        | Registry Worker                               | immutable control-plane mutation trail                     |

There are **no future category gaps** in the day-one Registry contract. The
seven non-operational categories share one constrained, versioned catalog table
instead of proliferating unrelated D1 tables. This is deliberate: the Registry
owns metadata shape and queryability, while application-specific data remains in
the owning service.

## NestJS producer pattern

Your preferred explicit pattern remains the primary API:

```ts
RegistryModule.forRoot({
  application: "identity",
  version: process.env.APP_VERSION!,
  registryUrl: process.env.REGISTRY_URL!,
  registrationToken: process.env.REGISTRY_TOKEN,
  environment: process.env.FIGENTRA_ENVIRONMENT,
});

RegistryModule.forFeature({
  modules: [{ key: "identity" }],
  resources: [{ key: "users", moduleKey: "identity" }],
  actions: [
    { key: "read", resourceKey: "users", permission: "identity:users:read" },
  ],
  navigation: [
    { key: "users", path: "/users", permission: "identity:users:read" },
  ],
  workflows: [
    {
      key: "identity.sync-users",
      version: "1",
      runtime: "cloudflare-workflow",
      worker: "workflow-runtime",
      binding: "WORKFLOW_RUNTIME",
      permissions: ["identity:users:write"],
    },
  ],
});
```

For larger modules, decorators are also supported. Nest `DiscoveryService`
collects classes/providers/controllers marked with `@RegistryModuleDefinition`,
`@RegistryResource`, `@RegistryAction`, `@RegistryNavigation`,
`@RegistryCapability`, `@RegistryWorkflow`, `@RegistryEvent`,
`@RegistryIntegration`, `@RegistrySetting`, `@RegistryFeature`,
`@RegistryWidget`, and `@RegistryLocalization`.

Both explicit `forFeature()` contributions and discovered decorators are merged
into one canonical immutable version manifest. Services never write D1 directly.

## Workflow relationship

The Registry **does not execute workflows** and never downloads executable code.

```text
@figentra/workflows
      │
      ├── @Workflow / @Step / @Before / @After / @Compensate
      └── Nest DiscoveryService
                │
                ▼
       @figentra/registry
                │
                ▼
       Registry Worker / D1
                │
                └── workflow metadata

Application/API ───────────────► workflow-runtime Worker
                                      │
                                      ▼
                               Cloudflare Workflow
                                      │
                                      └── native step.do()
```

Registry can therefore answer **“what workflows exist, which version is active,
what permissions do they require, and which Worker executes them?”** It is not
the workflow engine.

## Query APIs

- `GET /v1/applications/:slug` — current application metadata.
- `GET /v1/applications/:slug/metadata` — complete current-version inventory,
  including all day-one catalog categories.
- `GET /v1/applications/:slug/versions/:version` — immutable release manifest.
- `GET /v1/catalog/:category` — query `event`, `workflow`, `integration`,
  `setting`, `feature`, `widget`, or `localization` across applications;
  optionally filter by `application` or `version`.
- `GET /v1/workflows` — convenience workflow inventory endpoint, optionally
  filtered by `application`.
- `POST /v1/registrations` — authenticated service-principal registration.
- `GET /v1/routes/resolve` — private Gateway route resolution.
- `/health/live` — liveness.
- `/health/ready` — D1 readiness.

## Security and enterprise invariants

- Registry inventory reads require `registry:read`.
- Registry registration is service-principal-only.
- Registration and route resolution use separate JWT audiences.
- Upstreams are HTTPS-only and restricted to the approved Figentra DNS suffix.
- D1 is authoritative; KV is never authoritative.
- Application versions are immutable and content-hashed.
- Catalog items are immutable within an application version.
- Registration is idempotency-protected by application + version.
- Every mutation is audited.
- Registration is rate-limited.
- No secret values are accepted as Registry metadata.
- Registry never executes application code.
- Registry never becomes the workflow runtime, queue runtime, IAM runtime, or
  tenant database.

## Runtime ownership

**Registry Worker:** Hono + D1 + KV. This is the production control plane.

**`@figentra/registry`:** NestJS producer SDK. It provides `RegistryModule`,
discovery, decorators, manifest composition, and registration transport. It is
not the Registry runtime.

**`@figentra/workflows`:** workflow declaration/discovery package. It is not a
durable engine.

**`workers/workflow-runtime`:** generic Cloudflare Workflow runtime. Application
workflow code is bundled into this Worker (or a dedicated workflow Worker) and
executed by native Cloudflare Workflows.

**`workers/infrastructure-orchestrator`:** specialized workflow control plane
for Terraform. It remains separate because infrastructure approvals, environment
locks, and Terraform Containers are its domain-specific responsibilities.

## Production verification

```bash
pnpm cf-typegen
pnpm check
pnpm test:coverage
pnpm build
pnpm exec wrangler d1 migrations list DB --remote
```

Real D1 integration, Cloudflare Workflow execution, load/soak, security testing,
and production rehearsal remain deployment gates rather than claims of local
static validation.
