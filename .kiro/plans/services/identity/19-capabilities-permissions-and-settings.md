---
status: canonical
document: service-capabilities-permissions-settings
service: identity
version: v1
---
# Identity Service — Capabilities, Permissions and Settings Catalog

## 1. Capabilities exposed
Identity registers these service capabilities: `identity.authenticate`, `identity.token.verify`, `identity.session.manage`, `identity.identity-link.manage`, `identity.service-identity.manage`, `identity.delegation.manage`, `identity.provider-webhook.ingest`, `identity.provider.reconcile`, `identity.security-state.read`.

## 2. IAM permission catalog
Administrative permissions consumed by Identity are stable keys owned by the IAM catalog:
- `identity.principal.read`
- `identity.principal.disable`
- `identity.session.read`
- `identity.session.revoke`
- `identity.session.revoke-any`
- `identity.identity.read`
- `identity.identity.link`
- `identity.identity.unlink`
- `identity.service-identity.read`
- `identity.service-identity.create`
- `identity.service-identity.rotate`
- `identity.service-identity.revoke`
- `identity.delegation.read`
- `identity.delegation.create`
- `identity.delegation.revoke`
- `identity.provider.reconcile`
- `identity.security-events.read`

Self-service actions are still authenticated and policy-checked; `self` is a resource relation, not an authorization bypass. Sensitive administrative operations require configured assurance/MFA level.

## 3. Resource types
Registry/IAM resource metadata: `principal`, `session`, `identity-binding`, `service-identity`, `delegation`, `provider-connection`. Resource IDs are canonical Figentra IDs, never raw provider subjects as public resource identifiers.

## 4. Service settings
Operational settings include session inactivity/max-age, verification/recovery action expiry, provider timeouts, JWKS refresh/stale window, webhook tolerance, reconciliation batch size/cadence, service-credential rotation age/overlap, delegation maximum duration, per-endpoint rate limits, idempotency retention, security-notification policy and realtime connection limits.

Every setting has type, min/max/enum constraints, environment mutability, restart requirement, secret classification, default policy and owning module. Security-sensitive settings cannot be changed through an ungoverned generic settings endpoint; changes require controlled configuration deployment or an explicitly authorized administrative configuration workflow with audit.

## 5. Feature/capability state
Provider-dependent features such as MFA, passkeys and enterprise SSO are represented as observed configured capabilities, not assumed support. Capability state includes `enabled`, `supported`, provider source, configuration version and last validation time. A missing provider capability fails explicitly; the service does not fake it.

## 6. Registry projection
The NestJS package registers capabilities, resource types, permissions consumed, settings metadata, assurance requirements and feature/capability state schema. Registry never stores permission grants, session state, secret values or authoritative runtime settings.

## 7. Tests
Catalog tests enforce globally unique immutable permission keys, route-to-permission coverage, capability-to-controller/handler coverage, setting schema validation, production-safe defaults, no-secret Registry projection and no uncatalogued administrative operation.