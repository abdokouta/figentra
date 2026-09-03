---
status: canonical
component: package
package: "@stackra/security"
owner: platform
---
# `@stackra/security` — implementation-complete plan

## Purpose
Runtime-neutral security primitives used by platform packages: cryptographic hashing, encryption/decryption, secure comparison, secret references, key-provider boundaries, redaction and security classification. Authorization remains IAM-owned and authentication orchestration remains Identity-owned.

## Source layout
`src/crypto`, `src/hashing`, `src/encryption`, `src/keys`, `src/redaction`, `src/classification`, `src/errors`, `src/testing`, `src/index.ts`.

## Public contracts
```ts
interface Hasher { hash(input:Uint8Array|string):Promise<string>; verify(input:Uint8Array|string,digest:string):Promise<boolean> }
interface Encryptor { encrypt(data:Uint8Array, context:EncryptionContext):Promise<EncryptedValue>; decrypt(value:EncryptedValue, context:EncryptionContext):Promise<Uint8Array> }
interface KeyProvider { currentKey(purpose:string):Promise<KeyRef>; resolve(ref:KeyRef):Promise<CryptoKey> }
interface Redactor { redact(value:unknown, classification?:DataClassification):unknown }
```
`EncryptedValue` contains algorithm, key reference, nonce/IV, ciphertext and version; plaintext keys are never serialized.

## Algorithms
Use vetted platform/standard-library primitives. Password hashing uses an adaptive password KDF (Argon2id where available and approved by the security baseline). Data encryption uses authenticated encryption (AES-256-GCM or an explicitly approved equivalent). SHA-256 is for integrity/content addressing, not password storage. Randomness comes only from cryptographically secure runtime APIs.

## Key management
Application keys are referenced through a secret/KMS provider; this package never persists master keys. Rotation uses versioned key references. Decryption remains backward-compatible for the configured retention period; encryption always uses the current key. Key-provider failures fail closed for protected data.

## Redaction/classification
Fields are classified as public, internal, confidential or restricted. Logs, telemetry, errors and audit records use allowlists/redaction policies. Tokens, passwords, private keys, raw authentication credentials and encryption keys are always restricted.

## Security invariants
Constant-time comparison for secrets, authenticated ciphertext, nonce uniqueness, bounded input sizes, canonical encoding and explicit algorithm identifiers. No custom cryptography. No silent downgrade when a configured algorithm is unavailable.

## Testing
Known-answer vectors, tamper detection, wrong-key failures, key rotation, password verification, constant-time comparison behavior, redaction fixtures, random nonce uniqueness, malformed ciphertext and runtime conformance. Security tests run in CI and against production adapters.

## Operational behavior
Cryptographic failures are typed and safe to expose. Key-provider latency and errors are observable without logging key material. CPU-expensive password hashing has explicit concurrency limits.

## Completion criteria
Every package requiring cryptography consumes these contracts; no raw password hashing, homemade encryption or secret serialization exists elsewhere; production key providers and rotation procedures are specified and tested.