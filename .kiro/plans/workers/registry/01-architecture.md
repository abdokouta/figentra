# Registry — Architecture

## Decision

The Application Registry is an independent Cloudflare Worker + Hono control-plane application. It is not NestJS and is not a business service. Its authoritative storage is Cloudflare D1; KV is a rebuildable cache.

## Mission

Provide a trusted, versioned metadata plane through which Figentra applications and platform runtimes publish and resolve sanitized application metadata: applications, versions, environments, routes, services, capabilities, permissions, events, consumers, workers, schedulers, configuration schemas, resources, reports, search definitions, branding metadata and deployment/runtime metadata.

## Authority

Applications own source manifests and business data. The Registry owns the published metadata projection and publication lifecycle. Registry records are authoritative for discovery and routing metadata after successful publication; they are never authoritative for business state.

## Boundaries

Own: application registration, version/environment identity, manifest publication, validation/projection, route/resource/action metadata, capability catalog, service/runtime metadata, event/consumer metadata, configuration metadata, compatibility metadata, safe branding metadata, discovery and resolution.

Do not own: business entities, service PostgreSQL data, credentials/secrets, source code, React/Native implementations, arbitrary JavaScript/CSS, SQL, business authorization, billing, workflow execution, logs, traces, analytics facts or notification delivery.

## Trust model

Public reads may expose only explicitly public metadata. Publication requires authenticated application/service identity, signed or integrity-checked manifest material, tenant/application binding, schema validation and authorization. Browser-supplied application/tenant IDs never establish authority.

## Runtime topology

Cloudflare DNS/WAF → Registry Worker → request context → auth prevalidation → rate limit → schema validation → D1 transaction → KV invalidation/version update → response. Worker-to-worker calls use Service Bindings. Container calls use authenticated HTTPS.

## Consistency

Publication is strongly consistent in D1. Publication identity is `(applicationId, environmentId, version, manifestHash)`. Same identity/hash is idempotent; same version with a different hash is a conflict. KV is eventually consistent and disposable. Immutable versioned metadata is cacheable; mutable aliases are invalidated transactionally as far as the platform permits.

## Availability

Registry is not an application startup hard dependency. Applications must have locally valid manifests and continue startup if Registry publication is temporarily unavailable. Route-critical Gateway resolution has an explicit cached/known-good policy and must never invent routes.

## Security invariants

Tenant/application isolation is enforced server-side. Secrets, tokens, credentials, source files, executable code, SQL, arbitrary origins and unbounded payloads are rejected. Publication cannot mutate another application/environment. All writes are idempotent and audited.

## Dependencies

Cloudflare Worker runtime, D1, KV, WAF/rate limiting, Service Bindings, `@stackra/contracts`, registry NestJS integration package, Identity trust configuration, and Audit integration for durable governance evidence. No service database is accessed directly.

## Acceptance

Deterministic resolution; D1 authority; validated immutable publications; complete registry taxonomy; no executable/business data; secure publication; cache rebuildability; compatibility/versioning; observable and recoverable Worker runtime.