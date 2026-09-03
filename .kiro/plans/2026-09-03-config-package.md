---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/config — architecture plan

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md),
[ADR-0088](../../.docs/adr/ADR-0088-environment-canonical-identifiers.md)
**Reference:** `.ref/packages/config/` (`@stackra/config` v0.1.0) **Depends
on:** `@stackra/container` (Task 13), `@stackra/contracts` (Task 6),
`@stackra/support` (Manager), and OPTIONAL peers for secret-manager drivers:
`@dopplerhq/node-sdk` (Doppler), `@aws-sdk/client-secrets-manager` (AWS),
`@google-cloud/secret-manager` (GCP), `node-vault` (Vault).

**Design effort:** 20 days across 10 phases (was 16 days pre-cloud-secrets
addendum; +4 days for Phase 2b — Doppler + AWS + GCP + Vault drivers).

## Purpose

`@stackra/config` is the workspace's canonical configuration abstraction — the
ONE way every service, worker, and app reads its runtime configuration.

Enterprise requirements day one:

- **Layered composition** — static defaults → env vars → remote fetches →
  runtime overrides. Later layers win.
- **Zod-schema-first validation** — the config schema IS the type. Missing or
  malformed values fail-fast at boot.
- **Hot-reload** — remote drivers (HTTP, Consul, etcd) refresh on interval;
  services subscribe to change events.
- **Dot-notation** — `config.get("http.default.timeout")` walks nested paths.
- **Secrets integration** — Doppler-first per `.kiro/steering/doppler.md`; no
  `process.env.SECRET_KEY` in application code.
- **Cross-runtime** — Node reads `process.env`; Worker reads `env.<binding>`;
  browser reads inlined build-time constants; RN reads Expo constants +
  AsyncStorage.
- **JSON-schema doc generation** — CLI generates `docs/config-schema.json` for
  enterprise config-management tools.
- **Encrypted values** — support `enc:base64:xxx` sigil with per-env keys
  (KMS-backed on production).
- **Environment identifiers** — matches ADR-0088 canonical env names.
- **NestJS `ConfigModule` compat** — services already using `@nestjs/config`
  drop-in swap.

## Non-goals

- Live config UI (that's an admin service).
- Full feature-flag system (that's `@stackra/feature-flags` planned).
- Runtime code loading (no plugin architecture through config).

## Manager pattern — Manager (Shape A per ADR-0090)

`ConfigManager extends Manager<IConfigDriver>` — Shape A because a single app
has ONE active driver at a time (env-based dev, remote-http on production).
Multiple drivers stack via the `layered` driver (special driver that composes N
inner drivers).

```typescript
ConfigModule.forRoot({
  default: "layered",
  channels: {
    static: { driver: "static", data: { app: { name: "approval" } } },
    env: { driver: "env", prefix: "APPROVAL_" },
    http: { driver: "http", url: "https://config.example.com/v1/services/approval", refreshMs: 30_000 },
    layered: {
      driver: "layered",
      channels: ["static", "env", "http"], // right-most wins
    },
  },
  schema: z.object({...}), // Zod schema for validation
});
```

## Subpath layout (per ADR-0091)

```
packages/config/
├── src/
│   ├── core/
│   │   ├── config.module.ts
│   │   ├── commands/                  # CLI: config:dump, config:validate, config:schema
│   │   ├── constants/
│   │   ├── decorators/                # @ConfigValue(key, options), @ConfigNamespace(prefix)
│   │   ├── drivers/                   # env, static, memory, http, layered (from .ref)
│   │   ├── errors/                    # ConfigValidationError, ConfigDriverError, ConfigKeyError
│   │   ├── interfaces/                # from .ref: config-event-emitter, config-service-options, config-violation, driver-options, value-metadata
│   │   ├── services/                  # ConfigManager, ConfigService, ValueResolver, SchemaValidator
│   │   ├── utils/                     # dot-notation, encrypt/decrypt, doppler-shim
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── config.module.ts           # replaces / composes @nestjs/config
│   │   ├── decorators/                # NestJS DI wrappers for @ConfigValue
│   │   ├── health/
│   │   │   └── config.health-indicator.ts
│   │   └── index.ts
│   │
│   ├── react/                         # cross-platform providers
│   │   ├── providers/                 # <ConfigProvider>
│   │   ├── hooks/                     # useConfig, useConfigValue, useConfigChange
│   │   └── index.ts
│   │
│   ├── native/                        # RN — reads Expo Constants + AsyncStorage
│   │   ├── drivers/
│   │   │   ├── expo-constants.driver.ts
│   │   │   └── async-storage.driver.ts
│   │   └── index.ts
│   │
│   ├── worker/
│   │   ├── config.module.ts
│   │   ├── drivers/
│   │   │   └── worker-env-binding.driver.ts   # reads env.<KEY> at request time
│   │   └── index.ts
│   │
│   ├── vite/                          # Vite plugin — injects config at build time
│   │   ├── plugin.ts
│   │   ├── virtual-module.ts          # `import cfg from 'virtual:stackra-config'`
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-config.ts             # in-memory driver + set/get for tests
│       ├── config-fixture.ts
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol                  | Kind                                 |
| ----------------------- | ------------------------------------ |
| `IConfigDriver`         | interface                            |
| `IConfigManager`        | interface                            |
| `IConfigService`        | interface                            |
| `IConfigChangeEvent`    | interface                            |
| `IConfigSchema`         | interface                            |
| `IValueMetadata`        | interface                            |
| `IConfigViolation`      | interface                            |
| `CONFIG_MANAGER`        | token                                |
| `CONFIG`                | token (alias for `manager.driver()`) |
| `CONFIG_SCHEMA`         | token                                |
| `ConfigValidationError` | class                                |
| `ConfigKeyError`        | class                                |

## Core API (locked)

```typescript
interface IConfigService {
  // Read
  get<T>(key: string, defaultValue?: T): T;
  getOrFail<T>(key: string): T;
  getBoolean(key: string, defaultValue?: boolean): boolean;
  getNumber(key: string, defaultValue?: number): number;
  getString(key: string, defaultValue?: string): string;
  getArray<T>(key: string, defaultValue?: T[]): T[];
  getObject<T>(key: string, defaultValue?: T): T;

  // Introspect
  has(key: string): boolean;
  keys(prefix?: string): string[];
  all(): Record<string, unknown>;

  // Change subscription
  on(key: string, listener: (event: IConfigChangeEvent) => void): () => void;
  onAny(listener: (event: IConfigChangeEvent) => void): () => void;

  // Runtime override (used sparingly — usually only in tests)
  set(key: string, value: unknown): void;
}
```

## Drivers (locked)

**Base drivers — always shipped:**

| Driver               | Home                                          | Purpose                                        |
| -------------------- | --------------------------------------------- | ---------------------------------------------- |
| `static`             | `core/drivers/static.driver.ts`               | Compile-time config objects                    |
| `env`                | `core/drivers/env.driver.ts`                  | Reads `process.env` w/ prefix + parsing        |
| `memory`             | `core/drivers/memory.driver.ts`               | In-memory (mostly tests)                       |
| `http`               | `core/drivers/http.driver.ts`                 | Fetches from remote config service; refresh    |
| `layered`            | `core/drivers/layered.driver.ts`              | Composes N drivers; right-most wins            |
| `worker-env-binding` | `worker/drivers/worker-env-binding.driver.ts` | Cloudflare Worker `env.<KEY>` reads            |
| `expo-constants`     | `native/drivers/expo-constants.driver.ts`     | RN — Expo Constants                            |
| `async-storage`      | `native/drivers/async-storage.driver.ts`      | RN — @react-native-async-storage/async-storage |
| `doppler-shim`       | `core/drivers/doppler-shim.driver.ts`         | Reads `doppler run` env vars w/ prefix         |

**Secret-manager drivers — cloud-native (optional peers):**

| Driver        | Home                                 | Peer dep                                     | Purpose                                                                                                                                                                                              |
| ------------- | ------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doppler`     | `core/drivers/doppler.driver.ts`     | `@dopplerhq/node-sdk` (optional peer)        | Full Doppler API — fetches secrets at boot, refresh, service tokens, config lifecycle. Preferred over `doppler-shim` when the app can talk to the Doppler API directly (Node/NestJS/Worker w/ HTTP). |
| `aws-secrets` | `core/drivers/aws-secrets.driver.ts` | `@aws-sdk/client-secrets-manager` (optional) | AWS Secrets Manager — batch `BatchGetSecretValue`, in-memory cache w/ TTL, `AssumeRole` on ECS Task Roles.                                                                                           |
| `gcp-secrets` | `core/drivers/gcp-secrets.driver.ts` | `@google-cloud/secret-manager` (optional)    | GCP Secret Manager — `accessSecretVersion` w/ automatic ADC (Application Default Credentials) on Cloud Run.                                                                                          |
| `vault`       | `core/drivers/vault.driver.ts`       | `node-vault` OR fetch-based (optional)       | HashiCorp Vault — KV v2, transit engine, dynamic database secrets, auto-renew on TTL.                                                                                                                |

**Cloud-secret driver contract:** every driver implements `IConfigDriver` with a
background-refresh interval (default `refreshMs: 300_000` = 5 min). Cache
locally in-memory; secrets are FAIL-CLOSED — a boot-time fetch failure throws
`ConfigDriverError` unless `fallback: <other-driver-name>` is set in options.

**Doppler driver auth modes:**

- Local dev: reads `DOPPLER_TOKEN` from `process.env` (bound by `doppler run`).
- CI: `DOPPLER_TOKEN` env var w/ a service token scoped to the config.
- Cloudflare Worker: HTTP-fetches
  `https://api.doppler.com/v3/configs/config/secrets/download` w/ an in-memory
  bearer cache. NO Doppler CLI in Worker runtime.

**AWS Secrets Manager driver auth modes:**

- Local dev: `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` env vars.
- ECS / Fargate / Lambda: `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` (Task Role
  auto-injected by ECS agent).
- EKS: `AWS_ROLE_ARN` + `AWS_WEB_IDENTITY_TOKEN_FILE` (IRSA / IAM Roles for
  Service Accounts).

## Source-per-concern composition — the multi-source pattern

`@stackra/config` is designed for MULTIPLE concurrent sources, each owning its
own concern. The `layered` driver composes them; right-most wins.

**Reference deployment layer stack:**

```typescript
{
  default: "layered",
  channels: {
    // 1. STATIC — build-time defaults + type-safe defaults
    static: {
      driver: "static",
      data: {
        app: { name: "identity-service", tier: "shared" },
        http: { defaultTimeout: 10_000 },
      },
    },

    // 2. ENV — local dev overrides (developers' .env files)
    //         + build-time constants (VITE_*, NEXT_PUBLIC_*)
    env: {
      driver: "env",
      prefix: "IDENTITY_",
    },

    // 3. DOPPLER — runtime secrets (dev + CI + prod)
    doppler: {
      driver: "doppler",
      project: "identity-service",
      config: "prd",
      refreshMs: 300_000,
    },

    // 4. AWS-SECRETS — AWS-hosted secrets (KMS-encrypted)
    "aws-secrets": {
      driver: "aws-secrets",
      region: "us-east-1",
      secretIds: [
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:identity/db-password-abc123",
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:identity/jwt-signing-key-def456",
      ],
      refreshMs: 300_000,
    },

    // 5. HTTP — remote config for UI (feature flags, kill switches)
    "remote-config": {
      driver: "http",
      url: "https://config.example.com/v1/services/identity",
      refreshMs: 30_000,
      publicOnly: true,  // marks values as PUBLIC — safe to leak in client bundle
    },

    // Composition — right-most wins
    layered: {
      driver: "layered",
      channels: ["static", "env", "doppler", "aws-secrets", "remote-config"],
    },
  },
}
```

**Reading behaviour:** every `.get(key)` walks the layer stack. Every layer
either OWNS the key (returns value + `metadata: { source, layer, updatedAt }`)
or doesn't (returns `undefined`). Right-most wins; the metadata tells the caller
which source provided the value.

**Concern → source mapping (default convention):**

| Concern                                     | Source                    | Refresh   |
| ------------------------------------------- | ------------------------- | --------- |
| Build-time defaults (app name, version)     | `static`                  | Never     |
| Local dev overrides                         | `env`                     | Boot only |
| Runtime secrets (credentials, keys, tokens) | `doppler` / `aws-secrets` | 5 min     |
| Feature flags + kill switches (UI-facing)   | `http` (remote-config)    | 30 s      |
| Cloudflare Worker bindings                  | `worker-env-binding`      | Boot only |
| RN app defaults                             | `expo-constants`          | Boot only |

Consumer code stays source-agnostic:

```typescript
const config = useInject<ConfigService>(CONFIG_SERVICE);
const dbUrl = config.get("db.url"); // resolved from doppler
const featureX = config.get("features.x"); // resolved from remote-config
const appName = config.get("app.name"); // resolved from static
```

## Secret marking + validation

Every schema field marked `.secret()` MUST resolve from a secret-manager driver
(`doppler` / `aws-secrets` / `gcp-secrets` / `vault`). Boot fails-fast if a
`.secret()`-marked field resolves from `static` or `env` (dev-mode exception:
`env` allowed when `NODE_ENV === "development"`).

```typescript
const schema = z.object({
  app: z.object({ name: z.string() }),
  db: z.object({
    url: z.string().url(),
    password: z.string().secret(), // ← MUST come from doppler / aws / gcp / vault
  }),
});
```

## Validation

Every config binds to a Zod schema at boot:

```typescript
const schema = z.object({
  app: z.object({
    name: z.string(),
    env: z.enum(["dev", "stg", "prd"]),
    port: z.number().int().positive(),
  }),
  http: z.object({
    default: z.object({
      timeout: z.number().default(10_000),
      retries: z.number().default(3),
    }),
  }),
  database: z.object({
    url: z.string().url(),
    poolSize: z.number().default(10),
  }),
});

ConfigModule.forRoot({
  default: "layered",
  channels: { ... },
  schema,
  onValidationError: "fail-fast", // "warn" | "fail-fast" | "collect"
});
```

`SchemaValidator` runs at boot; violations short-circuit start-up (or report to
log per `onValidationError`).

## Decorators (NestJS + framework)

```typescript
@Injectable()
export class ApprovalService {
  public constructor(
    @ConfigValue("approval.timeout", { default: 30_000 })
    private readonly timeout: number,

    @ConfigNamespace("http.approval")
    private readonly httpConfig: IHttpClientConfig,
  ) {}
}
```

- `@ConfigValue(key, options?)` — inject a single value.
- `@ConfigNamespace(prefix)` — inject an object shape under a prefix.

## Change subscriptions + hot-reload

HTTP driver refreshes on interval; when values change:

```typescript
this.config.on("feature.new-checkout", (event) => {
  this.logger.info("feature.new-checkout changed", event);
});
```

Cross-runtime: browser uses BroadcastChannel to sync across tabs; server emits
on `@stackra/events`.

## Secrets — Doppler-first

Secrets NEVER hard-coded. Config layer separates PUBLIC (config-service or env
vars) from SECRETS (Doppler-managed). Convention:

- Every deployable ships a `.doppler.yaml` at its root.
- `.env.example` lists PLACEHOLDER keys; real values come from `doppler run --`.
- Config validation checks that any key marked `secret: true` in the schema IS a
  Doppler-sourced value (not a compile-time literal).
- Cloudflare Worker secrets injected via `env.<KEY>` bindings; `wrangler.jsonc`
  matches Doppler config keys 1:1.

## JSON-schema docs generation

CLI `config:schema --output docs/config-schema.json` emits a JSON Schema
document derived from the Zod schema. Useful for:

- Documenting valid config to operators.
- Feeding config-management tools (Consul-template, envsubst-style).
- Machine-readable schema validation in CI.

## Cross-runtime notes

- **Node/NestJS** — layered `static + env + http`. Best-of-breed defaults +
  per-env overrides via `.env.doppler` + remote refresh.
- **Cloudflare Worker** — layered `static + worker-env-binding`. Every value
  bound in `wrangler.jsonc`. No HTTP driver (would race with fetch handler
  lifecycle).
- **Browser (Vite)** — Vite plugin walks `packages/*/src/core/config/schema.ts`,
  generates `virtual:stackra-config` at build time. No runtime driver except
  memory (for hot-reload during dev).
- **React Native** — `static` (build-time constants via Expo Constants) +
  `async-storage` (user preferences).

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "@nestjs/config": "catalog:nestjs",
    "react": "catalog:react",
    "react-native": "catalog:react-native",
    "zod": "catalog:",
    "vite": "^7.0.0",
    "expo-constants": "^19.0.0",
    "@react-native-async-storage/async-storage": "^2.2.0",
  },
  "peerDependenciesMeta": {
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "@nestjs/config": { "optional": true },
    "react": { "optional": true },
    "react-native": { "optional": true },
    "vite": { "optional": true },
    "expo-constants": { "optional": true },
    "@react-native-async-storage/async-storage": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Contracts + Scaffold (2 days)

- [ ] Contracts split.
- [ ] `packages/config/` scaffold with 7 subpaths.

### Phase 2 — Core (4 days)

- [ ] `ConfigManager extends Manager<IConfigDriver>`.
- [ ] 5 base drivers: static, env, memory, http, layered.
- [ ] `ConfigService` w/ dot-notation, typed accessors, change subscribers.
- [ ] `SchemaValidator` w/ Zod integration.
- [ ] `@ConfigValue` + `@ConfigNamespace` decorators.
- [ ] CLI commands.

### Phase 2b — Secret-manager drivers (4 days)

- [ ] `DopplerDriver` w/ full Doppler API — service tokens, `secrets/download`,
      background refresh, in-memory cache. Optional peer: `@dopplerhq/node-sdk`.
- [ ] `AwsSecretsDriver` — `BatchGetSecretValue`, IRSA + ECS Task Role auth
      chain. Optional peer: `@aws-sdk/client-secrets-manager`.
- [ ] `GcpSecretsDriver` — `accessSecretVersion` w/ ADC. Optional peer:
      `@google-cloud/secret-manager`.
- [ ] `VaultDriver` — KV v2 + transit + dynamic-db-creds. Optional peer:
      `node-vault` OR fetch-based.
- [ ] `.secret()` schema marker + boot-time validation that secrets don't
      resolve from `static` / `env` (dev-mode exception documented).
- [ ] `secretRotationEvents` fire on `secret.rotated` when the background
      refresh detects a value change — enables in-flight rebinding (DB pool,
      Redis client, JWT signer).

### Phase 3 — NestJS (2 days)

- [ ] `ConfigModule.forRoot()` + `forRootAsync()`.
- [ ] Wire NestJS `ConfigService` compat.
- [ ] `ConfigHealthIndicator`.

### Phase 4 — Worker (1 day)

- [ ] `WorkerEnvBindingDriver`.
- [ ] Cold-start optimisation (no HTTP driver).

### Phase 5 — React (1 day)

- [ ] `<ConfigProvider>` cross-platform.
- [ ] `useConfig`, `useConfigValue(key)`, `useConfigChange(key)` hooks.

### Phase 6 — Native (1 day)

- [ ] `ExpoConstantsDriver` + `AsyncStorageDriver`.

### Phase 7 — Vite plugin (2 days)

- [ ] Plugin walks per-package schemas.
- [ ] Emits `virtual:stackra-config` module.
- [ ] HMR support in dev.

### Phase 8 — Testing (1 day)

- [ ] `MockConfig` w/ .set() / .get() / .assertHas().

### Phase 9 — Docs + Release (2 days)

**Total effort:** 16 days.

## Success criteria

- [ ] 7 subpath exports build cleanly.
- [ ] Zod validation short-circuits boot on invalid config.
- [ ] Layered driver composes static + env + http; right-most wins.
- [ ] HTTP driver refresh triggers `.on(key, listener)`.
- [ ] Vite plugin injects `virtual:stackra-config` at build time.
- [ ] Worker driver reads `env.<KEY>` binding.
- [ ] `@ConfigValue` decorator injects typed value w/ default.

## Cross-references

- ADR-0090, 0091, 0092, 0088.
- `.kiro/steering/doppler.md` — secrets integration convention.
- `.kiro/plans/2026-09-03-events-package.md` — config-change events.
- `.ref/packages/config/` — reference (5 drivers).
