---
status: canonical
component: package
package: "@stackra/contracts"
owner: platform
---
# `@stackra/contracts` — implementation-complete plan

## 1. Purpose
The only shared package allowed to publish cross-service protocol contracts. It contains versioned DTOs, commands, queries, events, errors, enums, identifiers and protocol interfaces. It is a protocol package, not a domain implementation package.

## 2. Non-goals
- No ORM entities, repositories, migrations or database schemas.
- No service implementation or provider SDK types.
- No authorization decisions or business workflows.
- No transport implementation; HTTP/NATS are adapters around these contracts.

## 3. Package shape
```text
src/
  common/ ids, pagination, request-context, money, time
  commands/ <service>/<version>/
  queries/ <service>/<version>/
  events/ <service>/<version>/
  errors/ <service>/<version>/
  enums/ <service>/<version>/
  schemas/ <service>/<version>/
  interfaces/ protocol interfaces only
  versions/ compatibility metadata
  index.ts
```

## 4. Locked contracts
Every wire contract uses `readonly` fields and JSON-safe values. Dates are RFC3339 strings; identifiers are opaque strings; monetary values use `{amountMinor: bigint|string, currency:string}` on the domain side and decimal-string wire forms where JSON requires it. Pagination uses a cursor plus `limit` and never exposes database offsets.

```ts
export interface PageRequest { readonly cursor?: string; readonly limit?: number }
export interface Page<T> { readonly items: readonly T[]; readonly nextCursor?: string }
export interface ServiceError { code:string; category:string; message:string; retryable:boolean; requestId:string }
```

## 5. Validation
Each exported contract has a Standard Schema-compatible validator and a JSON serialization fixture. Unknown-field behavior is explicit per version. Input limits are mandatory: strings, arrays, objects and nested depth have bounded maxima. Validation errors never contain secrets.

## 6. Versioning
Public contracts are namespaced by service and major version (`iam.v1`, `billing.v1`, etc.). Additive changes may remain in the same major version only when all consumers tolerate them. Breaking changes create a new version, compatibility fixtures, migration notes and an explicit deprecation window. Events are immutable once published.

## 7. Event contract
Events contain `eventId`, `eventType`, `version`, `occurredAt`, `producer`, `tenantId` when applicable, `correlationId`, `causationId` and typed `data`. Event payloads never contain provider secrets or mutable ORM representations.

## 8. Commands and queries
Commands describe intent and are idempotency-aware; queries describe read models and pagination. Both include request context where crossing a service boundary. Contracts do not prescribe whether transport is synchronous or asynchronous.

## 9. Testing
- schema parse/safeParse fixtures for every contract;
- serialization round trips;
- backward/forward compatibility matrix;
- event envelope validation;
- generated OpenAPI and event catalogue snapshots;
- forbidden imports test ensuring no ORM/provider implementation leaks.

## 10. Security and tenancy
Tenant identifiers are explicit protocol fields where required. Contracts never infer tenant from payload content. Sensitive fields carry classification metadata for redaction. Service-to-service authentication is represented by request metadata, never by embedding credentials in DTOs.

## 11. Exports
Only stable public exports are exposed from package entrypoints. Internal helper types remain private. Consumers import `@stackra/contracts/<service>/<version>` or the documented root export; deep imports into `src` are forbidden.

## 12. Completion criteria
A service contract is complete only when every endpoint/command/query/event/error has a schema, TypeScript type, version, examples, compatibility fixture, security classification and owner. No `any`, placeholder DTO, `TODO`, or unversioned cross-service contract is accepted.