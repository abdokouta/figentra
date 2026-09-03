---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://hashing-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/hashing` — password hashing w/ pluggable algorithms

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/hashing/` (`@stackra/nestjs-hashing` v0.1.0) **Depends on:**
`@stackra/container`, `@stackra/contracts`, `@stackra/support`,
`@stackra/logger` (optional) **Design effort:** 8 days across 5 phases

## Purpose

Password hashing w/ pluggable algorithms — bcrypt, argon2 (recommended), scrypt.
Ships:

- `HashingManager extends Manager<IHashingDriver>` — Shape A. ONE active
  algorithm at a time (per app).
- Timing-safe verification.
- Rehash detection — the service detects when a hash's cost params fall below
  current defaults + returns `needsRehash: true`. Enables graceful cost bumps on
  login without a mass password reset.

## Non-goals

- Symmetric encryption — that's `@stackra/encryption`.
- HMAC signing — that's `@stackra/signing` (future).
- Password strength validation — separate concern; consider
  `@stackra/validation` or a Zod schema.

## Public API — locked

```typescript
class HashingService {
  async hash(plaintext: string, opts?: { driver?: string }): Promise<string>;

  async check(plaintext: string, hash: string): Promise<boolean>;

  async needsRehash(
    hash: string,
    targetOpts?: {
      driver?: string; // hash was produced by a different algorithm?
      cost?: number; // cost param below current default?
    },
  ): Promise<boolean>;

  info(hash: string): {
    algorithm: string;
    cost: number;
    salt: string;
    hash: string;
  };
}
```

### `@Hashed` decorator (MikroORM optional peer)

```typescript
class User {
  @Property()
  @Hashed()  // ← auto-hashes on write; comparison via .checkPassword()
  password!: string;

  async checkPassword(plaintext: string): Promise<boolean> { ... }
}
```

## Drivers

| Driver     | Peer                                | Recommended?                                                |
| ---------- | ----------------------------------- | ----------------------------------------------------------- |
| `argon2id` | `@node-rs/argon2`                   | Yes — memory-hard, GPU-resistant, RFC-9106 approved.        |
| `argon2i`  | `@node-rs/argon2`                   | Password hashing default (v1 fallback).                     |
| `bcrypt`   | `bcrypt` (npm) OR `@node-rs/bcrypt` | Legacy compat only; new hashes use argon2id.                |
| `scrypt`   | Node's `crypto.scrypt`              | Node-only; no external dep. Deprecated for new deployments. |

**Default:** `argon2id` w/ params
`{ memoryCost: 19456 (19 MiB), timeCost: 2, parallelism: 1 }` — OWASP
recommendation as of 2024.

Fallback: `bcrypt` w/ cost `12` when `argon2id` peer isn't installed.

## Rehash detection

The service compares:

- **Algorithm** — hash was produced by driver X; current default is Y → rehash.
- **Cost params** — `memoryCost < currentDefault.memoryCost` → rehash.

Consumer usage:

```typescript
async login(email: string, password: string) {
  const user = await this.userRepo.findByEmail(email);
  if (!user) throw new Unauthorized();

  if (!await this.hashing.check(password, user.passwordHash)) {
    throw new Unauthorized();
  }

  if (await this.hashing.needsRehash(user.passwordHash)) {
    user.passwordHash = await this.hashing.hash(password);
    await this.userRepo.save(user);
  }

  return this.tokenService.issue(user);
}
```

## Subpath layout

```
packages/hashing/
├── package.json                          # 3 subpath exports
├── src/
│   ├── core/                             # ".": cross-runtime
│   │   ├── hashing.module.ts
│   │   ├── services/
│   │   │   ├── hashing.service.ts
│   │   │   └── hashing-manager.service.ts
│   │   ├── drivers/
│   │   │   ├── argon2.driver.ts
│   │   │   ├── bcrypt.driver.ts
│   │   │   ├── scrypt.driver.ts
│   │   │   └── null.driver.ts            # for tests
│   │   ├── constants/
│   │   │   └── default-params.const.ts   # OWASP-recommended
│   │   ├── decorators/
│   │   │   └── hashed.decorator.ts
│   │   ├── errors/
│   │   │   ├── unsupported-algorithm.error.ts
│   │   │   └── invalid-hash.error.ts
│   │   ├── interfaces/
│   │   │   ├── hashing-driver.interface.ts
│   │   │   ├── hash-info.interface.ts
│   │   │   └── hashing-options.interface.ts
│   │   ├── utils/
│   │   │   ├── phc-format-parser.util.ts  # PHC string format
│   │   │   ├── timing-safe-compare.util.ts
│   │   │   └── detect-algorithm.util.ts
│   │   └── index.ts
│   ├── nest/                             # "./nest": MikroORM integration
│   │   ├── nest-hashing.module.ts
│   │   ├── mikro-orm-type.ts             # @Hashed decorator runtime
│   │   └── index.ts
│   └── testing/
│       ├── mock-hashing.ts               # instant hash+verify for tests
│       └── index.ts
└── __tests__/
    └── unit/
        ├── argon2.test.ts
        ├── bcrypt.test.ts
        ├── needs-rehash.test.ts
        ├── phc-parser.test.ts
        └── timing-safe.test.ts
```

## Phases

### Phase 1 — Scaffold (1 day)

- [ ] Package skeleton.
- [ ] `HashingManager` (Shape A).

### Phase 2 — Drivers (3 days)

- [ ] `Argon2Driver` — memory-hard defaults.
- [ ] `BcryptDriver` — cost 12 default.
- [ ] `ScryptDriver` — Node's built-in.
- [ ] `NullDriver` — passthrough for tests.

### Phase 3 — Service + rehash detection (1 day)

- [ ] `hash()`, `check()`, `needsRehash()`, `info()`.
- [ ] PHC-format parser + emitter.
- [ ] Timing-safe comparison (Node's `crypto.timingSafeEqual` OR polyfill).

### Phase 4 — Nest + `@Hashed` decorator (1 day)

- [ ] `NestHashingModule`.
- [ ] `MikroOrmHashedType` — transparent hashing on write.

### Phase 5 — Testing + docs (2 days)

- [ ] Unit tests (10+ files).
- [ ] Cross-driver test — verify a bcrypt hash + rehash it as argon2id.
- [ ] `MockHashing` for consumer tests.
- [ ] README documents default params + upgrade path.

## Exit criteria

- [ ] Every driver produces PHC-formatted hashes.
- [ ] `check()` runs in constant time (verified w/ timing test).
- [ ] `needsRehash()` correctly flags algo + cost mismatches.
- [ ] `@Hashed` decorator transparently hashes DB writes.
- [ ] Default params match OWASP 2024 recommendations.
- [ ] 95% branch coverage.

## Cross-refs

- OWASP Password Storage Cheat Sheet — the reference for default params.
- `@stackra/encryption` — sibling package.
- Auth service (business-tier package) — the primary consumer.
