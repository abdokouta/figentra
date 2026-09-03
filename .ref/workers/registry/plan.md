# Application Registry — Production Plan

## Purpose

The Registry is the authoritative control-plane catalog for deployable
applications, modules, resources, actions, capabilities, branding metadata, and
route metadata.

## Runtime

- Cloudflare Worker
- Hono
- D1 authoritative persistence
- KV optional read cache
- Wrangler
- `@figentra/observability/worker`
- Pino-backed structured logging

## Data ownership

D1 is authoritative. KV is a non-authoritative cache only.
Terraform/`cloud.yaml` provision the bindings; registry application metadata is
not duplicated in Terraform.

## Functional areas

- Application registration.
- Application metadata.
- Versioning.
- Modules/resources/actions.
- Capabilities.
- Theme/branding metadata.
- Route metadata.
- Permission metadata.
- Search/list/query APIs.
- CI/service-principal registration authentication.
- Optimistic/version-aware updates.
- Audit emission for administrative mutations.

## Completed

- Hono Worker scaffold.
- D1 binding contract.
- Migration/schema structure.
- Route organization.
- Authentication middleware boundary.
- Request/correlation context.
- Versioned API boundary.
- Wrangler environment contract.
- KV cache contract.
- `cf-typegen`.
- Unified observability and Pino logging.

## Verified implementation controls

- [x] Service-principal registration authorization.
- [x] Dedicated registration and route-resolution audiences.
- [x] Registration rate limiting.
- [x] Immutable version/content-hash identity.
- [x] Atomic D1 registration batch.
- [x] Audit record for registration mutations.
- [x] D1-authoritative KV cache model.
- [x] Application/metadata/route cache invalidation.
- [x] HTTPS + approved DNS suffix upstream validation.
- [x] Navigation category persisted and exposed.
- [x] Category inventory documented with explicit gaps.

## External / future production gates

- [ ] Real-D1 integration tests.
- [ ] Load/soak testing.
- [ ] Security/penetration testing.
- [ ] Production deployment rehearsal.
- [ ] First-class tables/APIs for events, workflows, integrations, settings,
      features, widgets, and localization.

These are deliberately tracked as explicit gates instead of being hidden behind
a claim of 100% runtime verification.

## Non-goals

The Registry is not a generic database and must not become a business-domain
store.
