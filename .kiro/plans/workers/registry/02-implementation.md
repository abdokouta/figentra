# Registry — Implementation Contract

## Source tree

```text
workers/registry/
├── src/index.ts
├── src/bootstrap/{app,config,bindings,shutdown}.ts
├── src/context/{request,principal,tenant,correlation}.ts
├── src/domain/{application,version,environment,publication,manifest,route,capability,permission,event,consumer,worker,schedule,configuration}.ts
├── src/application/{commands,queries,services}.ts
├── src/manifest/{schema,validator,normalizer,sanitizer,projector,hash}.ts
├── src/repositories/{applications,publications,metadata}.ts
├── src/infrastructure/{d1,kv,cache,bindings}.ts
├── src/security/{auth,authorization,redaction,limits}.ts
├── src/routes/{applications,publications,manifests,discovery,health}.ts
├── src/http/{errors,responses,validation}.ts
└── src/observability/{logging,tracing,metrics}.ts
├── migrations/
├── test/{unit,integration,contract,e2e,security,load,recovery}/
├── wrangler.toml
└── package.json
```

## Application modules

Application registration creates immutable application identity. Version registration binds a semantic/application version to an artifact/source revision and manifest hash. Environment registration binds deployment environment and domain metadata. Publication validates, normalizes, sanitizes, hashes and atomically projects metadata. Discovery reads indexed projections. Resolution applies exact application/environment/version/route rules.

## Manifest processing

Input → parse → size/schema validation → structural validation → authorization validation → secret/code/SQL/URL rejection → normalization → canonical JSON → SHA-256 hash → projection transaction. Unknown fields are rejected unless explicitly declared by the versioned schema. Projection is deterministic and never executes manifest content.

## Runtime controls

Hono middleware order: request ID/correlation/trace extraction → method/path/body/header limits → security headers → CORS for public reads → authentication prevalidation for protected operations → rate limit → route/schema validation → handler → normalized response/error mapping. No middleware performs business authorization.

## Persistence

Repositories are D1-only. Every write uses a transaction-equivalent atomic sequence supported by D1 semantics and records an operation/publication idempotency key. Unique constraints protect application/environment/version/hash identity. KV entries contain only rebuildable projections keyed by immutable revision/hash or controlled aliases.

## Error model

Stable codes: `INVALID_REQUEST`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VERSION_CONFLICT`, `MANIFEST_INVALID`, `MANIFEST_FORBIDDEN_CONTENT`, `IDEMPOTENCY_CONFLICT`, `REGISTRY_UNAVAILABLE`, `RATE_LIMITED`, `UPSTREAM_FAILURE`, `INTERNAL_ERROR`. Errors contain requestId and safe details only.

## Lifecycle

Startup validates configuration and bindings, creates no authoritative in-memory state, verifies D1 schema, installs routes and readiness. Shutdown stops accepting new requests and flushes telemetry. Registry publication and reconciliation are idempotent and restart-safe.

## Forbidden implementation shortcuts

No in-memory registry authority, no direct service DB access, no dynamic code execution, no arbitrary Terraform/IaC execution, no secret storage, no provider-specific business models in public contracts, no blocking application startup on registry publication, and no undocumented routes.