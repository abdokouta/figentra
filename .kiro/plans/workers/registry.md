---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
runtime: cloudflare-worker
---

# Application Registry — independent Cloudflare Worker implementation plan

**Runtime decision:** Cloudflare Worker + Hono. The repository specification explicitly selects the Registry as an independent control-plane Worker, not a NestJS service. fileciteturn601file0

## Ownership

The Registry is the platform metadata/control-plane registry. Applications remain authoritative for their manifests and business data. The Registry stores a sanitized, versioned, discoverable projection.

It owns application identity/lifecycle metadata, versions, environments, deployment metadata, manifest projections, route/resource/action/permission metadata, capabilities, facts, reports, event metadata and safe branding/theme metadata.

It never owns application business logic, application databases, secrets, React components, JSX, SQL or mutable business entities.

## Runtime and storage

```text
Cloudflare DNS/WAF
      ↓
Registry Worker (Hono)
      ↓
request context + auth prevalidation
      ↓
D1 authoritative registry metadata
      +
KV/cache for explicitly cacheable immutable metadata
```

D1 is authoritative. KV is an optimization and must be rebuildable. No in-memory Worker state is authoritative.

## Source layout

```text
workers/registry/
├── src/bootstrap/
├── src/routes/{applications,manifests,capabilities,versions,health}
├── src/domain/{application,version,environment,manifest,deployment}
├── src/application/{commands,queries,services}
├── src/infrastructure/{d1,kv,cache,bindings}
├── src/manifest/{schema,validator,normalizer,projection}
├── src/security/{auth,authorization-prevalidation,redaction}
├── src/observability/{logging,tracing,metrics}
└── src/index.ts
├── migrations/
├── wrangler.toml
└── __tests__/{unit,integration,contract,e2e,security}/
```

## Manifest publication

```text
Application source
  ↓ decorators / explicit definitions
Manifest compiler
  ↓ schema validation + normalization
Signed/versioned application.manifest.json
  ↓
Registry publication
  ↓
D1 projection
  ↓
cache invalidation/version publication
```

The application is authoritative. Registry publication never executes application code.

The manifest may describe application/version/environment, modules, resources, entities, actions, permissions, routes, navigation, dashboards, widgets, capabilities, features, facts, reports, search definitions, API contracts, event contracts, configuration schema, compatibility and validated branding tokens. Secrets, arbitrary JS/CSS, SQL, component implementations and business logic are forbidden.

## API surface

```http
GET /applications
GET /applications/:application
GET /applications/:application/manifest
GET /applications/:application/capabilities
GET /applications/:application/version
POST /applications/:application/manifest/publications
```

Write/publication operations require service/application authentication and idempotency. Public reads return sanitized registry data.

## Request pipeline

```text
Cloudflare DNS/WAF
 → Worker
 → request/correlation/trace context
 → issuer/audience/signature prevalidation
 → application/tenant context resolution
 → rate limit
 → schema validation
 → command/query
 → D1 transaction
 → cache invalidation/version update
 → response
```

Edge authentication is prevalidation. Protected business authorization remains authoritative in the relevant service.

## Security

Never trust browser-supplied tenant/application IDs. Validate issuer, audience, signature and expiry. Publication requires explicit capability/role. Reject secret-bearing manifests. Prevent cache poisoning with immutable version/hash keys. Do not expose private origins unnecessarily.

## Concurrency and consistency

Publication identity is `(application, environment, version, manifestHash)`. Replaying an identical publication is idempotent. Reusing a version with a different hash is rejected. Cached reads are keyed by immutable revision or controlled revision token.

## Resilience

Registry availability is never an application startup hard dependency. CI/build publication is preferred; optional boot reconciliation publishes asynchronously and does not block startup. Writes retry with bounded backoff. KV is disposable and rebuildable from D1.

## Observability

Every request carries request/correlation/trace IDs. Metrics cover latency, cache hit/miss, publication success/failure, manifest validation failures, D1 latency and rate-limit rejection. Logs redact tokens and sensitive manifest fields.

## Testing

Test route/auth failures, hostname/application resolution, publication idempotency, conflicting versions, manifest schema validation, secret rejection, D1 consistency, cache invalidation, rate limits, bindings and Worker restart/failure. Contract tests validate all consumers against versioned APIs.

## Deployment

Wrangler manages Worker, D1 and KV bindings. Development/staging/production configuration is isolated. D1 migrations are reviewed and forward-compatible; KV has no independent migration authority. CI compiles and validates manifests before publication/deployment.

## Phases

1. Worker/bootstrap/bindings.
2. D1 schema/repositories.
3. manifest schema/validation/projection.
4. read APIs.
5. authenticated publication and idempotency.
6. cache/versioning.
7. security/observability/rate limits.
8. contract/e2e/recovery tests.
9. production deployment and migration runbook.

## Exit criteria

Registry is an independent Cloudflare control-plane Worker; manifests are application-owned; D1 is authoritative; publication is authenticated/idempotent; cache is disposable; no business logic or secrets enter the registry; every trust boundary has tests.

## Cross-references

`.kiro/specs/figentra-platform/workers/02-registry.md`, `.kiro/specs/figentra-platform/ARCHITECTURE.md`, ADR-0014, ADR-0021, `.kiro/plans/workers/README.md`.
