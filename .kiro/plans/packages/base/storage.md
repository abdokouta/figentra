---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/storage"
anchor_adrs: [ADR-0090, ADR-0091]
depends_on: ["@stackra/contracts", "@stackra/errors", "@stackra/support", "@stackra/config"]
---
# `@stackra/storage` — implementation plan

## Purpose
Provider-neutral durable storage abstraction. The package exposes explicit storage types: `KeyValueStore`, `SecureStorage`, `FileSystemStorage`, and `ObjectStorage`. It does not own cache semantics and does not become a database abstraction.

## Public API
```ts
interface KeyValueStore<V=unknown> {
  get<T extends V>(key:string):Promise<T|null>;
  set<T extends V>(key:string,value:T,options?:{ttlMs?:number}):Promise<void>;
  delete(key:string):Promise<boolean>;
  has(key:string):Promise<boolean>;
}
interface SecureStorage { get(key:string):Promise<string|null>; set(key:string,value:string):Promise<void>; delete(key:string):Promise<void>; }
interface ObjectStorage {
  put(key:string,body:AsyncIterable<Uint8Array>|Uint8Array,options?:PutOptions):Promise<ObjectReceipt>;
  get(key:string,options?:GetOptions):Promise<ObjectReader|null>;
  head(key:string):Promise<ObjectMetadata|null>;
  delete(key:string):Promise<void>;
  signedUrl(key:string,options:SignedUrlOptions):Promise<string>;
}
interface FileSystemStorage { read(path:string):Promise<Uint8Array>; write(path:string,data:Uint8Array):Promise<void>; delete(path:string):Promise<void>; list(prefix?:string):Promise<FileEntry[]>; }
```

## Source tree
```text
packages/storage/
├── src/core/{storage.module.ts,contracts.ts,capabilities.ts,errors/,index.ts}
├── src/key-value/{manager.ts,drivers/,index.ts}
├── src/secure/{manager.ts,drivers/,index.ts}
├── src/filesystem/{manager.ts,drivers/,index.ts}
├── src/object/{manager.ts,drivers/,index.ts}
├── src/runtime/{node,browser,worker,native,desktop}/
├── src/testing/{memory-drivers.ts,storage-fixture.ts,index.ts}
└── __tests__/{unit,conformance,integration}/
```

## Provider boundary
Drivers are explicit and capability-reported. Production object storage uses a real configured provider; missing configuration is a bootstrap/configuration error. Provider SDK types remain inside drivers. Signed URLs include operation, expiry and content constraints.

## Consistency/atomicity
Each storage type documents read-after-write, conditional write and delete semantics. `ObjectStorage` uploads use content length/checksum when available. Conditional writes use provider-native ETags/version IDs. The package never claims stronger consistency than the active driver provides.

## Security
Keys are canonicalized and length-limited. Tenant prefixes are created by explicit key builders. Secure storage delegates to OS/keychain/secret-manager capability. Object access requires least-privilege credentials and bounded signed URLs. Path traversal, absolute filesystem escapes and unsafe schemes are rejected.

## Reliability
Retries occur only for classified transient/idempotent operations. Streaming uses bounded chunks and cancellation. Provider outages return typed dependency errors. Partial multipart/object writes are cleaned up or marked for reconciliation. No caller relies on storage cache behavior for correctness.

## Runtime behavior
Node uses filesystem/object/secret drivers appropriate to server deployments. Browser uses indexed/keychain-like capabilities only where available. Worker uses platform bindings. Unsupported capabilities return `StorageCapabilityError` rather than a fake success/no-op.

## Observability
Metrics: operation latency, error rate, bytes read/written, object size, signed URL creation, retries and provider throttling. Logs contain key class/provider operation, not secret values or full object bodies. OTel spans are provider-neutral.

## Testing
Driver conformance for CRUD, conditional operations, stream cancellation, checksums, path safety, signed URL constraints, outage/retry and tenant key isolation. Integration tests run against every production provider configured in the repository matrix.

## Implementation phases
1. Core contracts/capability model.
2. Key-value and secure-storage drivers.
3. Filesystem and object-storage drivers.
4. Runtime adapters/configuration.
5. Conformance/testing/observability.
6. Failure, security and load verification.

## Exit criteria
- All durable storage use cases select an explicit storage type.
- Production adapters are real and capability-tested.
- Tenant-safe keys and secret handling are enforced.
- No provider SDK leaks into consumers.
- Cache/database implementations do not duplicate storage primitives.
