---
status: canonical
component: package
package: "@stackra/config"
owner: platform
---
# `@stackra/config` — implementation-complete plan

## Purpose
Provide one typed configuration boundary for every runtime. Configuration is assembled from explicit sources, validated before use, frozen into a runtime snapshot and never accessed through ad-hoc `process.env` calls outside adapters.

## Source model and precedence
Sources are: built-in defaults (non-secret only), deployment environment, configuration file/manifests, and secret references. Precedence is explicitly `defaults < file < environment`; secrets resolve only through the secret provider. Tenant configuration is separate from process configuration and is loaded through service/domain repositories.

## Public contracts
```ts
interface ConfigSource { readonly name:string; load():Promise<Record<string,unknown>> }
interface SecretReference { readonly provider:string; readonly key:string; readonly version?:string }
interface ConfigManager<T> { get<K extends keyof T>(key:K):T[K]; require<K extends keyof T>(key:K):T[K]; snapshot():Readonly<T> }
```
`ConfigSchema<T>` defines required values, coercion policy, bounds, enum constraints and secret references. Missing production configuration is a bootstrap error.

## Layout
`src/schema`, `src/loaders`, `src/sources`, `src/secrets`, `src/validation`, `src/runtime`, `src/errors`, `src/index.ts`.

## Runtime behavior
Node/NestJS resolves once during bootstrap and exposes an immutable snapshot. Worker runtimes resolve once per isolate or invocation according to platform lifecycle. Browser/RN builds receive a compile-time safe public configuration subset; server secrets can never be bundled.

## Security
Secret values are opaque and excluded from logs, error messages, telemetry and serialized snapshots. Only allowlisted public configuration reaches browser bundles. Production rejects unknown critical settings and insecure TLS/credential modes. Configuration keys containing credentials, tokens or private keys require secret references.

## Validation
Schema validation occurs before modules initialize. Cross-field constraints are supported. Numeric values have min/max bounds; URLs are parsed and scheme-allowlisted; durations are normalized to milliseconds; comma-delimited values are never silently accepted where arrays are required.

## Reload
Runtime configuration is immutable by default. A reloadable setting must explicitly declare reload semantics, synchronization, rollback behavior and consumers. Secrets may rotate through provider references without exposing the secret value to application code where the provider supports it.

## Testing
Source precedence, missing values, malformed types, secret resolution failures, redaction, public-bundle filtering, reload behavior, environment isolation and bootstrap failure tests. Production configuration fixtures must be validated in CI.

## Completion criteria
Every service and runtime has a typed schema and documented variables; no direct environment access exists outside source adapters; required production settings fail before traffic is accepted; secret values never appear in repository artifacts or diagnostics.