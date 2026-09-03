---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/database — architecture plan

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md),
[ADR-0011](../../.docs/adr/ADR-0011-no-shared-database.md) (one DB per service)
**Reference:** `.ref/packages/orm/` (`@stackra/nestjs-orm`),
`.ref/packages/orm/src/orm.module.ts` **Depends on:**
`.kiro/plans/2026-09-03-container-package.md`

## Purpose

`@stackra/database` is the workspace's canonical data-access layer. It wraps
**MikroORM 6.x** and ships:

- A cross-runtime ORM surface — **PostgreSQL for services**, **Cloudflare D1
  (SQLite) for workers**, **SQLite for tests**, one consistent API.
- Auto-generated CRUD (service + resolver + controller + repository) via
  `OrmModule.forFeature([{ entity, dto }])`.
- A Laravel-shaped fluent migration builder
  (`Schema.createTable(name, (t) => {...})`) wrapping MikroORM's `addSql()`.
- Entity decorators for common traits: `@Timestamps`, `@Userstamps`,
  `@SoftDeletes`, `@Versionable`, `@Auditable`, `@Sluggable`, `@Publishable`,
  `@Sortable`, `@Encrypted`.
- Multi-connection support — one Postgres primary + N read replicas OR one D1
  per Worker environment.

**Origins.** The reference package (`@stackra/nestjs-orm`) was Nest-only +
coupled tightly to PostgreSQL. This plan generalises it to Cloudflare D1 (Worker
runtime) and formalises the Manager pattern for driver swapping (Postgres vs D1
vs SQLite-for-tests).

## Non-goals

- Full SQL query builder parity with Knex. MikroORM has one internally; we
  expose ONLY what our fluent Schema builder needs.
- ORM-agnostic support. This package is a MikroORM wrapper by contract. If we
  ever move off MikroORM, the ABI break is intentional.
- Cross-tenant reads at the ORM layer. Tenant isolation belongs in the service
  layer per `.kiro/steering/tenancy-columns.md`; the ORM sees whichever
  connection the tenant router hands it.
- Migration rollback for Cloudflare D1 (Wrangler's `d1 migrations` primitive
  doesn't support rollback; forward-only is the D1 contract).

## Subpath layout (per ADR-0091)

```
packages/database/
├── src/
│   ├── core/                          # runtime-agnostic
│   │   ├── constants/
│   │   ├── decorators/                # @Entity, @Property, @Timestamps, @SoftDeletes, ...
│   │   ├── enums/                     # SortDirection, ArchiveStrategy
│   │   ├── entity/                    # BaseEntity abstract class
│   │   ├── errors/                    # DatabaseConnectionError, MigrationError
│   │   ├── factories/                 # defineService, defineResolver, defineController factories
│   │   ├── filters/                   # buildFilterQuery, buildSortQuery (platform-agnostic)
│   │   ├── graphql/                   # GraphQL type generators
│   │   ├── http/                      # ZodValidationPipe (moves to nest subpath in Phase 2)
│   │   ├── i18n/                      # error messages
│   │   ├── interfaces/                # local
│   │   ├── query-builder/             # Fluent QueryBuilder shim wrapping MikroORM's
│   │   ├── relations/                 # @HasOne, @HasMany, @BelongsTo helpers
│   │   ├── schema/                    # defineSchema, collectSchemas
│   │   ├── schema-registry/           # SchemaRegistry + SchemaRegistryPopulator
│   │   ├── seeders/                   # BaseSeeder
│   │   ├── services/                  # EntityRegistryService, DatabaseManager
│   │   ├── state-machine/             # state-based entity lifecycle
│   │   ├── subscribers/               # LifecycleHooksSubscriber
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── database.module.ts         # DatabaseModule.forRoot / forFeature
│   │   ├── health/
│   │   │   └── database.health-indicator.ts
│   │   ├── indicators/
│   │   ├── pipes/                     # ZodValidationPipe
│   │   ├── controllers/               # SchemaController + generated
│   │   └── index.ts
│   │
│   ├── postgres/                      # optional peer: @mikro-orm/postgresql
│   │   ├── postgres.module.ts
│   │   ├── postgres-connection.factory.ts
│   │   └── index.ts
│   │
│   ├── d1/                            # optional peer: @mikro-orm/cloudflare-d1 OR raw D1 fallback
│   │   ├── d1.module.ts
│   │   ├── d1-connection.factory.ts
│   │   ├── d1-schema-runner.ts        # applies migrations via env.DB.exec()
│   │   └── index.ts
│   │
│   ├── migrations/
│   │   ├── schema-builder.ts          # Schema.createTable(name, (t) => {...})
│   │   ├── column-builder.ts          # t.string(name).nullable().default(...)
│   │   ├── migration-base.ts          # abstract Migration class
│   │   └── index.ts
│   │
│   ├── seeders/                       # runtime seeder registry
│   │   ├── seeder-manager.ts
│   │   └── index.ts
│   │
│   ├── worker/                        # Cloudflare Worker adapter
│   │   ├── worker-database.factory.ts # createWorkerDatabase(env)
│   │   ├── request-em.ts              # per-request EntityManager fork
│   │   └── index.ts
│   │
│   └── testing/
│       ├── pglite-database.ts         # In-process Postgres via @electric-sql/pglite
│       ├── sqlite-database.ts         # In-process SQLite for D1 tests
│       ├── mock-em.ts                 # Mock EntityManager
│       ├── seed-factory.ts            # defineFactory helper for test data
│       ├── transactional-test.ts      # withTransaction() wrapper
│       └── index.ts
│
├── __tests__/
├── LICENSE
├── README.md
├── catalog.json
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## Contracts split (per ADR-0091 §Rule 1)

Symbols in `@stackra/contracts`:

| Symbol                    | Kind      |
| ------------------------- | --------- |
| `IEntity`                 | interface |
| `ICrudService<T>`         | interface |
| `IEntityRepository<T>`    | interface |
| `IUnitOfWork`             | interface |
| `IDatabaseHealth`         | interface |
| `IDatabaseConnection`     | interface |
| `ISchemaBuilder`          | interface |
| `IMigration`              | interface |
| `SortDirection` enum      | enum      |
| `DATABASE`                | token     |
| `DATABASE_MANAGER`        | token     |
| `ENTITY_MANAGER`          | token     |
| `DATABASE_CONFIG`         | token     |
| `DatabaseConnectionError` | class     |
| `MigrationError`          | class     |

## DatabaseManager — driver-manager (per ADR-0090)

`DatabaseManager extends MultipleInstanceManager<IDatabaseConnection>` — Shape B
(multi-instance) from ADR-0090 because the same service MAY need `primary`,
`readReplica`, `analyticsReadOnly` connections.

```typescript
@Injectable()
export class DatabaseManager extends MultipleInstanceManager<IDatabaseConnection> {
  protected driverKey = "driver";

  public constructor(
    @Inject(DATABASE_CONFIG) private readonly config: IDatabaseConfig,
  ) {
    super();
  }

  public getDefaultInstance(): string {
    return this.config.default;
  }

  public setDefaultInstance(name: string): void {
    this.config.default = name;
  }

  public getInstanceConfig(name: string): Record<string, unknown> | null {
    return this.config.connections[name] ?? null;
  }

  protected createPostgresDriver(cfg: IPostgresConfig): IDatabaseConnection {
    return new PostgresConnection(cfg);
  }

  protected createD1Driver(cfg: ID1Config): IDatabaseConnection {
    return new D1Connection(cfg);
  }

  protected createSqliteDriver(cfg: ISqliteConfig): IDatabaseConnection {
    return new SqliteConnection(cfg); // for tests via pglite / better-sqlite3
  }
}
```

Usage:

```typescript
DatabaseModule.forRoot({
  default: "primary",
  connections: {
    primary: { driver: "postgres", dbName: "approval", host: "...", ... },
    readReplica: { driver: "postgres", dbName: "approval", host: "read.rds.aws", ... },
    analytics: { driver: "postgres", dbName: "analytics_warehouse", ... },
  },
  entities: [Approval, Approver, Rule],
});
```

Or under a Worker:

```typescript
createWorkerDatabase(env).then((db) => {
  // db.instance() → D1Connection bound to env.DB
});
```

## OrmModule.forFeature — auto-CRUD

Direct port of `.ref/packages/orm/src/orm.module.ts` — the shape stays
identical:

```typescript
DatabaseModule.forFeature([
  {
    entity: User,
    dto: {
      create: CreateUserDto,
      update: UpdateUserDto,
      filter: UserFilterDto,
      sort: UserSortDto,
    },
    // Optional — omit to auto-generate all four
    service: UserService, // custom service class
    resolver: UserResolver, // custom GraphQL resolver
    controller: true, // auto-generate REST controller at /users
  },
]);
```

For each registered entity:

- **Schema** — `defineSchema()` walks decorated properties (`@Property`,
  `@Timestamps`, `@SoftDeletes`, ...) and generates a MikroORM `EntitySchema`.
- **Repository** — MikroORM's `EntityManager.getRepository()` auto-provides.
- **Service** — either the custom class OR an auto-generated CRUD service via
  `defineService(entity)`. Injected repo. Handles
  find/findOne/create/update/delete/paginate.
- **Resolver** — optional. Auto-generated via `defineResolver()` when `dto` is
  provided; exposes queries/mutations with the DTO shape.
- **Controller** — optional. Auto-generated via `defineController()` when
  `controller: true` OR a config object; REST endpoints at `/{entities}/{id}`.
- **DataLoader** — auto-registered with the shared `EntityDataLoaderFactory`
  when `@nestjs/graphql` is present (optional peer). Register N+1 batchers per
  relation.

## Fluent migration schema builder

Wraps MikroORM's `addSql()`. Runs on both Postgres (via `@mikro-orm/postgresql`)
and D1 (raw SQL emit).

```typescript
// migrations/2026-09-04-create-approvals.ts
import { Migration, Schema } from "@stackra/database/migrations";

export class CreateApprovals extends Migration {
  public up = Schema.createTable("approvals", (t) => {
    t.uuid("id").primary().default(t.raw("gen_random_uuid()"));
    t.string("subject").notNull();
    t.enum("status", ["pending", "approved", "rejected"]).default("pending");
    t.jsonb("metadata").default("{}");
    t.timestamp("created_at").notNull().default(t.raw("now()"));
    t.timestamp("updated_at").notNull().default(t.raw("now()"));
    t.timestamp("deleted_at").nullable();
    t.index(["status", "created_at"]);
    t.foreignKey("author_id").references("users.id").onDelete("cascade");
  });

  public down = Schema.dropTable("approvals");
}
```

`Schema.createTable`, `Schema.alterTable`, `Schema.dropTable`,
`Schema.renameTable`, `Schema.createIndex`, `Schema.dropIndex` — the six
primitives. All emit SQL via MikroORM's SQL escape/quote functions so the DDL is
dialect-appropriate.

`t.raw(...)` is the escape hatch for anything the builder doesn't cover.

**D1 caveat.** Cloudflare D1 rejects some Postgres-specific column types
(`jsonb`, `uuid`, `enum`). The builder falls back to safe defaults:

| Postgres        | D1 (SQLite)                          |
| --------------- | ------------------------------------ |
| `uuid`          | `text CHECK(length(value)=36)`       |
| `jsonb`         | `text` + JSON.stringify at ORM layer |
| `enum('a','b')` | `text CHECK(value IN ('a','b'))`     |
| `timestamp`     | `text` (ISO-8601)                    |
| `bytea`         | `blob`                               |

Documented in `docs/database/d1-compatibility.md`.

## Testing story

Every consumer uses one of two API surfaces:

### PGlite (in-process Postgres)

```typescript
import { createPGliteDatabase } from "@stackra/testing/database";

const db = await createPGliteDatabase({
  schema: [User, Post],
  migrations: [/* migration classes */],
});
```

Real Postgres SQL, in-process, no docker. `@electric-sql/pglite` handles
migration playback. Reset between tests with `db.reset()`.

### SQLite (for D1 mimicry)

```typescript
import { createSqliteDatabase } from "@stackra/testing/database";

const db = await createSqliteDatabase({
  schema: [User, Post],
  migrations: [/* migration classes */],
});
```

Uses `better-sqlite3` in-process. Matches D1's dialect. Ships as
`@stackra/testing/database/sqlite`.

### Per-test transactions

```typescript
import { withTransaction } from "@stackra/testing/database";

beforeEach(() =>
  withTransaction(db, (tx) => {
    // arrange: seed data
    // act + assert per test
    // afterEach: automatic rollback
  }),
);
```

Savepoint-nested-safe so nested `withTransaction` calls stack correctly.

## Auto-registration (per ADR-0092)

Optional — services with database access add `DatabaseModule.forRoot(...)` to
their app module. `StackraServiceModule` does NOT include it by default (some
services are pure request-router shells with no DB).

Pattern per service:

```typescript
@Module({
  imports: [
    StackraServiceModule.forRoot({ ... }),
    DatabaseModule.forRoot({
      default: "primary",
      connections: {
        primary: { driver: "postgres", dbName: "approval", host: "..." },
      },
      entities: [Approval, Approver],
    }),
    ApprovalModule,
  ],
})
export class AppModule {}
```

Every `ApprovalModule` inside uses `DatabaseModule.forFeature([...])` to
register its entities + auto-CRUD.

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@mikro-orm/core": "^6.0.0",
    "@mikro-orm/nestjs": "^6.0.0",
    "@mikro-orm/postgresql": "^6.0.0",
    "@mikro-orm/seeder": "^7.0.0",
    "@mikro-orm/cloudflare-d1": "^6.0.0",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "@nestjs/graphql": "^12.0.0",
    "graphql": "^16.0.0",
    "class-transformer": "^0.5.0",
    "class-validator": "^0.14.0",
    "zod": "catalog:",
  },
  "peerDependenciesMeta": {
    "@mikro-orm/postgresql": { "optional": true },
    "@mikro-orm/cloudflare-d1": { "optional": true },
    "@nestjs/graphql": { "optional": true },
    "graphql": { "optional": true },
    "class-transformer": { "optional": true },
    "class-validator": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Contracts split (2 days)

- [ ] `packages/contracts/src/interfaces/database/*.interface.ts`.
- [ ] `packages/contracts/src/tokens/database.tokens.ts`.
- [ ] `packages/contracts/src/errors/database-*.error.ts`.

### Phase 2 — Scaffold `packages/database` (1 day)

- [ ] Manifest suite (package.json + catalog.json + tsconfig + tsup + vitest).
- [ ] 7 subpath exports (`.`, `./nestjs`, `./postgres`, `./d1`, `./migrations`,
      `./worker`, `./testing`).

### Phase 3 — Port `@stackra/nestjs-orm` to `core/` (5 days)

- [ ] Copy decorators (`@Entity`, `@Property`, `@Timestamps`, `@SoftDeletes`,
      etc.) verbatim from `.ref/packages/orm/src/decorators/`.
- [ ] Copy `BaseEntity` from `.ref/packages/orm/src/entity/`.
- [ ] Copy `defineSchema` + `collectSchemas` from
      `.ref/packages/orm/src/schema/`.
- [ ] Copy filter builders (`buildFilterQuery`, `buildSortQuery`) — these are
      platform-agnostic per the reference index.ts.
- [ ] Copy `defineService` + `defineResolver` factories.
- [ ] Copy `SchemaRegistry`, `SchemaRegistryPopulator`, `EntityRegistryService`.
- [ ] Copy `LifecycleHooksSubscriber`.
- [ ] Copy `ScopeRegistry` + related utilities.

### Phase 4 — Migration schema builder (3 days)

- [ ] `Schema.createTable(name, cb)` + `alterTable` + `dropTable` +
      `renameTable`.
- [ ] `ColumnBuilder` — `.string()`, `.integer()`, `.text()`, `.uuid()`,
      `.timestamp()`, `.jsonb()`, `.enum()`, `.boolean()`, `.decimal()`.
- [ ] Chainable modifiers: `.nullable()`, `.notNull()`, `.default()`,
      `.unique()`, `.primary()`, `.references()`, `.onDelete()`, `.check()`.
- [ ] `Schema.createIndex()` + `dropIndex()` + `raw()` escape hatch.
- [ ] Dialect switch: Postgres emits Postgres DDL; D1/SQLite emits SQLite DDL
      with the fallback table (§Fluent schema builder).
- [ ] `Migration` abstract base class w/ `up` + `down`.

### Phase 5 — Postgres subpath (2 days)

- [ ] `PostgresConnection implements IDatabaseConnection`.
- [ ] `PostgresModule.forRoot(config)` — wires MikroORM.
- [ ] Connection pooling via MikroORM.

### Phase 6 — D1 subpath (4 days)

- [ ] `D1Connection implements IDatabaseConnection`.
- [ ] **Decision spike (2 days):** verify `@mikro-orm/cloudflare-d1` bundle
      viability under `wrangler`. If too heavy (>1MB), fallback to raw
      `env.DB.prepare()` + `env.DB.exec()` behind the fluent Schema builder.
- [ ] `D1Module.forRoot(env)` — reads `env.DB` binding.
- [ ] `D1SchemaRunner` — applies migrations at boot for local dev; production
      migrations run via `wrangler d1 migrations apply`.
- [ ] Documented dialect fallbacks per §"Fluent migration schema builder".

### Phase 7 — NestJS subpath (3 days)

- [ ] `DatabaseModule.forRoot(options)` — direct port of
      `.ref/packages/orm/src/orm.module.ts` `OrmModule.forRoot`.
- [ ] `DatabaseModule.forFeature(registrations)` — direct port of `.forFeature`.
- [ ] `DatabaseHealthIndicator`.
- [ ] `ZodValidationPipe` migration under nest/.

### Phase 8 — Worker subpath (2 days)

- [ ] `createWorkerDatabase(env)` — factory returning the D1-bound manager.
- [ ] Per-request `EntityManager` fork (Cloudflare Workers isolate model).

### Phase 9 — Testing helpers (3 days)

- [ ] `@stackra/testing/database` — currently ships PGlite (Task 8 of the main
      plan). Add `createSqliteDatabase()` for D1 mimicry.
- [ ] `withTransaction` — already ships (savepoint-nested-safe).
- [ ] `defineEntityFactory` — Faker-backed seed factories.
- [ ] Nest-integrated `TestingDatabaseModule` overrides for test doubles.

### Phase 10 — Consumer migration (5 days)

- [ ] `services/approval` — migrate to `@stackra/database`. Author entities.
      Ship first migration via the fluent Schema builder.
- [ ] Verify `@mikro-orm/postgresql` swaps in via optional peer.

### Phase 11 — Docs + release (2 days)

- [ ] Fill `README.md` subpath-by-subpath.
- [ ] `docs/database/{architecture,decorators,migrations,d1-compatibility,testing,seeders}.md`.
- [ ] Changeset `feat(database): initial 0.1.0`.

**Total estimated effort:** 32 days (~6 weeks single-track).

## Migration risks

| Risk                                                                                             | Mitigation                                                                                                               |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `@mikro-orm/cloudflare-d1` bundle too large for Workers                                          | Phase 6 decision spike. Raw `env.DB` fallback ready.                                                                     |
| D1's SQLite dialect differs from Postgres — silent data corruption                               | Dialect switch in Schema builder + `d1-compatibility.md` doc. Every migration author writes against BOTH dialects in CI. |
| MikroORM subscribers (`LifecycleHooksSubscriber`) not thread-safe under Worker isolate lifetimes | Per-request `EntityManager` fork. Documented + tested.                                                                   |
| Nest DataLoader auto-registration when `@nestjs/graphql` isn't installed                         | Optional peer + `@nestjs/graphql` guard in the OrmModule provider factory.                                               |
| Auto-generated controllers collide with hand-written ones                                        | Registration order + explicit `path` in the `controller: { path: ... }` config option.                                   |
| PGlite test performance for very large test suites                                               | Use `withTransaction` + rollback (documented). PGlite handles 1000s of tests/sec on modern hardware.                     |

## Success criteria

- [ ] 7 subpath exports build cleanly (`.`, `./nestjs`, `./postgres`, `./d1`,
      `./migrations`, `./worker`, `./testing`).
- [ ] `services/approval` runs identical CRUD before/after migration to
      `@stackra/database` (baseline: HTTP contract snapshot).
- [ ] A single migration file authored via `Schema.createTable(...)` applies
      cleanly to BOTH Postgres (via `mikro-orm migration:up`) AND SQLite (via
      `wrangler d1 migrations apply --local` OR direct sqlite3).
- [ ] `withTransaction` rollback isolates every test.
- [ ] Auto-generated CRUD service handles
      find/paginate/create/update/soft-delete end-to-end on approval entity.
- [ ] D1 bundle stays under 1MB (Wrangler limit) — verified in Phase 6 spike.

## Cross-references

- ADR-0090 — Manager pattern (DatabaseManager is Shape B canonical example).
- ADR-0091 — Cross-runtime subpaths (Postgres + D1 subpaths).
- ADR-0092 — Service auto-registration.
- ADR-0011 — No shared database (each service owns its own connection map).
- `.kiro/plans/2026-09-03-container-package.md` — DI substrate.
- `.kiro/plans/2026-09-03-logger-package.md` — sibling; MikroORM subscribers
  emit through logger.
- `.ref/packages/orm/` — reference package (source of Phase 3 port).
- `.ref/packages/orm/src/orm.module.ts` — reference `OrmModule.forRoot` +
  `forFeature`.
- `packages/testing/src/database/*.ts` — existing PGlite + `withTransaction`
  helpers that this package integrates with.
