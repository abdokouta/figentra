---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://encryption-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/encryption` — symmetric encryption + key management

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/encryption/` (`@stackra/nestjs-encryption` v0.1.0) **Depends
on:** `@stackra/container`, `@stackra/contracts`, `@stackra/support`,
`@stackra/logger` (optional), `@stackra/config` (optional — for
`KEY_MANAGEMENT_URL`) **Design effort:** 12 days across 6 phases

## Purpose

Cross-runtime symmetric encryption + key management. Every service that persists
user data behind rest-encryption composes from this. Ships:

- **AES-256-GCM** default cipher (authenticated encryption).
- **ChaCha20-Poly1305** as opt-in for edge-runtime perf (WebCrypto native).
- **Pluggable key sources** — env / KMS-per-cloud / Vault / Doppler (see
  `@stackra/config` cloud-secret drivers).
- **Key rotation** — every ciphertext carries a `keyId` header; old keys stay
  decryption-only, new writes use the current key.
- **Envelope encryption** — cloud-KMS wraps a per-record data key (DEK); the
  wrapped-DEK ships alongside the ciphertext. Enables per-tenant / per-row
  keying without a huge KMS bill.

## Non-goals

- Password hashing — that's `@stackra/hashing` (bcrypt/argon2/scrypt).
- Public-key crypto (RSA / Ed25519) — separate scope; consider
  `@stackra/signing` in a follow-up cycle.
- TLS termination — infrastructure layer, not app.

## Rules `@stackra/encryption` MUST follow

1. **Never use `crypto.createCipher()`** — deprecated + non-authenticated.
   Always `createCipheriv` w/ a fresh IV per encryption + a MAC.
2. **AAD (Additional Authenticated Data)** default = `keyId + version`. Binds
   the key rotation state to the ciphertext so replay w/ stale keys fails.
3. **IV is 12 bytes for GCM, 24 for ChaCha20-Poly1305.** Never reused.
4. **Ciphertext output is always base64url-encoded** with a stable header:
   `<version>.<keyId>.<iv>.<ciphertext>.<tag>`.
5. **No key material in logs.** Logger integration strips `key` / `plaintext`
   fields.

## Manager pattern — Manager (Shape A per ADR-0090)

`EncryptionManager extends Manager<IEncryptionDriver>` — Shape A. ONE active
cipher at a time (a service can't half-use AES + half-use ChaCha).

```typescript
{
  default: "aes-256-gcm",
  channels: {
    "aes-256-gcm": { driver: "aes-gcm", keyBits: 256 },
    "aes-128-gcm": { driver: "aes-gcm", keyBits: 128 },
    "chacha20": { driver: "chacha20-poly1305" },
  },
}
```

## Key sources (via KeyManager)

`KeyManager extends MultipleInstanceManager<IKeySource>` — Shape B. N named key
sources; a service may declare `at-rest` + `backup` sources for redundancy.

```typescript
{
  default: "primary",
  instances: {
    primary: {
      driver: "aws-kms",
      keyId: "arn:aws:kms:us-east-1:...:key/abc",
      // Envelope encryption — KMS wraps a per-record DEK.
      dekAlgorithm: "AES_256_GCM",
    },
    backup: {
      driver: "vault",
      transitPath: "transit/keys/primary",
    },
  },
}
```

Supported key-source drivers:

| Driver            | Provides                                          | Peer                   |
| ----------------- | ------------------------------------------------- | ---------------------- |
| `env`             | Reads `ENCRYPTION_KEY_<KEY_ID>` env vars          | none                   |
| `static`          | Inline `{ [keyId]: base64Key }` map               | none                   |
| `aws-kms`         | AWS KMS wrap / unwrap for DEKs                    | `@aws-sdk/client-kms`  |
| `gcp-kms`         | GCP Cloud KMS `encrypt` / `decrypt`               | `@google-cloud/kms`    |
| `azure-key-vault` | Azure Key Vault `wrapKey` / `unwrapKey`           | `@azure/keyvault-keys` |
| `vault-transit`   | HashiCorp Vault transit engine encrypt / decrypt  | `node-vault` (opt)     |
| `cloudflare`      | Cloudflare Worker Secrets — reads `env.<binding>` | Worker runtime         |

## Public API — locked

### `EncryptionService`

```typescript
class EncryptionService {
  async encrypt(
    plaintext: string | Buffer,
    opts?: {
      aad?: string | Buffer; // additional authenticated data
      keyId?: string; // override current key
    },
  ): Promise<string>; // base64url — includes version/keyId/iv/tag

  async decrypt(
    ciphertext: string,
    opts?: {
      aad?: string | Buffer;
    },
  ): Promise<Buffer>;

  async encryptJson<T>(value: T, opts?): Promise<string>;
  async decryptJson<T>(ciphertext: string, opts?): Promise<T>;

  // Envelope encryption — cheap for high-volume records
  async encryptEnvelope(plaintext: Buffer): Promise<{
    ciphertext: string;
    wrappedDataKey: string;
  }>;
  async decryptEnvelope(
    ciphertext: string,
    wrappedDataKey: string,
  ): Promise<Buffer>;
}
```

### `@Encrypted` decorator (MikroORM-integration via optional peer)

```typescript
class User {
  @PrimaryKey()
  id!: string;

  @Property()
  @Encrypted() // ← transparent encryption on write, decryption on load
  ssn!: string;

  @Property()
  @Encrypted({ aad: "email" }) // ← binds ciphertext to this row's email
  taxId!: string;
}
```

Registers a MikroORM `Type` that runs through `EncryptionService` on read /
write. Sees the DTO but never the raw value on the wire.

### `@stackra/encryption/worker`

Cloudflare Worker subpath — uses **WebCrypto** natively (no Node `crypto`
import). AES-GCM + ChaCha20 both work in Workers as of 2024+.

## Subpath layout

```
packages/encryption/
├── package.json                          # 4 subpath exports
├── src/
│   ├── core/                             # ".": cross-runtime
│   │   ├── encryption.module.ts
│   │   ├── services/
│   │   │   ├── encryption.service.ts
│   │   │   ├── encryption-manager.service.ts
│   │   │   ├── key-manager.service.ts
│   │   │   └── envelope-encryption.service.ts
│   │   ├── drivers/                      # ciphers
│   │   │   ├── aes-gcm.driver.ts
│   │   │   ├── chacha20-poly1305.driver.ts
│   │   │   └── null.driver.ts            # passthrough for tests
│   │   ├── key-sources/                  # key backends
│   │   │   ├── env.key-source.ts
│   │   │   ├── static.key-source.ts
│   │   │   ├── aws-kms.key-source.ts
│   │   │   ├── gcp-kms.key-source.ts
│   │   │   ├── azure-key-vault.key-source.ts
│   │   │   ├── vault-transit.key-source.ts
│   │   │   └── cloudflare.key-source.ts
│   │   ├── constants/
│   │   │   ├── cipher-header.const.ts
│   │   │   └── default-algorithm.const.ts
│   │   ├── decorators/
│   │   │   └── encrypted.decorator.ts
│   │   ├── errors/
│   │   │   ├── decryption-failed.error.ts
│   │   │   ├── key-not-found.error.ts
│   │   │   └── stale-key.error.ts
│   │   ├── interfaces/
│   │   │   ├── encryption-driver.interface.ts
│   │   │   ├── key-source.interface.ts
│   │   │   └── encryption-options.interface.ts
│   │   ├── utils/
│   │   │   ├── base64url.util.ts
│   │   │   ├── generate-iv.util.ts
│   │   │   └── parse-header.util.ts
│   │   └── index.ts
│   ├── worker/                           # "./worker": WebCrypto path
│   │   ├── web-crypto-aes-gcm.driver.ts
│   │   ├── web-crypto-chacha20.driver.ts
│   │   └── index.ts
│   ├── nest/                             # "./nest"
│   │   ├── nest-encryption.module.ts
│   │   ├── mikro-orm-type.ts             # @Encrypted decorator's runtime
│   │   └── index.ts
│   └── testing/
│       ├── mock-encryption.ts             # in-memory static-key
│       └── index.ts
└── __tests__/
    └── unit/                              # 15+ files
```

## Ciphertext format

```
v1.k-<keyId>.<iv-base64url>.<ct-base64url>.<tag-base64url>
```

- `v1` — format version.
- `k-<keyId>` — the key that encrypted this ciphertext. Enables rotation.
- `iv`, `ct`, `tag` — base64url-encoded.

Envelope encryption adds a wrapped-DEK block:

```
v1.k-<keyId>.<dek-wrapped>.<iv>.<ct>.<tag>
```

## Rotation flow

1. Deploy new `NEXT_KEY_ID` alongside `CURRENT_KEY_ID`.
2. `EncryptionService` uses `NEXT_KEY_ID` for encryption; decryption supports
   both (reads `keyId` from ciphertext header).
3. Background job re-encrypts old rows (via `@stackra/queue` /
   `@stackra/scheduler`).
4. Once all rows migrated, drop `CURRENT_KEY_ID`.

## Phases

### Phase 1 — Scaffold + cipher (2 days)

- [ ] Package skeleton.
- [ ] `AesGcmDriver` using Node's `crypto` + WebCrypto branch for Worker.
- [ ] Ciphertext header format locked.

### Phase 2 — Key sources (3 days)

- [ ] `KeyManager` (Shape B) + `env` / `static` sources.
- [ ] `AwsKmsKeySource`, `GcpKmsKeySource`, `AzureKeyVaultKeySource`,
      `VaultTransitKeySource`, `CloudflareKeySource`.

### Phase 3 — EncryptionService + envelope (2 days)

- [ ] `encrypt` / `decrypt` core.
- [ ] `encryptJson` / `decryptJson` wrappers.
- [ ] Envelope encryption w/ DEK caching.

### Phase 4 — Nest integration (2 days)

- [ ] `NestEncryptionModule` + MikroORM `@Encrypted()` decorator.
- [ ] Transparent read/write hooks.

### Phase 5 — Worker + ChaCha20 (2 days)

- [ ] WebCrypto path for Worker.
- [ ] `ChaCha20-Poly1305` driver.

### Phase 6 — Testing + docs + rotation runbook (1 day)

- [ ] Unit + integration tests — encrypt-decrypt roundtrip w/ every driver.
- [ ] `MockEncryption` for consumer tests.
- [ ] README documents rotation flow + threat model.

## Exit criteria

- [ ] AES-256-GCM + ChaCha20-Poly1305 round-trip in Node + Worker.
- [ ] Every key-source driver decrypts what the counterpart encrypted.
- [ ] Envelope encryption caches DEK for 5 min (configurable).
- [ ] `@Encrypted()` decorator transparently encrypts DB fields.
- [ ] Ciphertext survives key rotation (encrypted w/ v1, readable w/ v2).
- [ ] No plaintext in logs (verified via `@stackra/logger` integration test).
- [ ] 95% branch coverage.

## Cross-refs

- ADR-0090, 0091, 0092.
- `@stackra/hashing` — sibling for password hashing.
- `@stackra/config` — cloud secret drivers for key sources.
- `@stackra/database` — MikroORM `@Encrypted()` integration.
