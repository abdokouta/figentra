---
status: canonical
document: service-capabilities-permissions-settings
service: tenant
version: v1
---
# Tenant Service — Capabilities, Permissions and Settings Catalog

## Capabilities
`tenant.lifecycle.manage`, `tenant.organization.manage`, `tenant.membership.manage`, `tenant.domain.manage`, `tenant.settings.manage`, `tenant.context.resolve`, `tenant.context.version`, `tenant.domain.verify`.

## IAM permission keys
- `tenant.read`, `tenant.update`, `tenant.activate`, `tenant.suspend`, `tenant.archive`
- `tenant.organization.read`, `tenant.organization.create`, `tenant.organization.update`, `tenant.organization.archive`
- `tenant.membership.read`, `tenant.membership.invite`, `tenant.membership.add`, `tenant.membership.update`, `tenant.membership.remove`
- `tenant.domain.read`, `tenant.domain.create`, `tenant.domain.verify`, `tenant.domain.remove`
- `tenant.settings.read`, `tenant.settings.update`
- `tenant.context.read` for approved service/internal contexts

Resource types: `tenant`, `organization`, `membership`, `tenant-domain`, `tenant-setting`. Permission keys are immutable catalog entries; no route invents dynamic authorization strings.

## Tenant setting catalog
Every setting has stable key, schema version, value type, default, allowed range/enum, tenant applicability, mutable status, security classification, IAM permission and whether it bumps `tenantContextVersion`. Categories include branding/localization defaults, domain behavior, membership/invitation policy, security-sensitive tenant controls that Tenant legitimately owns, operational preferences, and product-neutral organization defaults. Product-specific settings remain product-owned.

A generic JSON blob without schema is forbidden for security/runtime behavior. Secret values are not stored as ordinary tenant settings; settings that reference secrets use secret references and appropriate owning service.

## Operational service settings
Domain verification limits/timeouts/cadence, context-cache TTL, membership/domain cardinality limits, lifecycle batch sizes, notification/realtime limits, rate limits, idempotency TTL, outbox/consumer/scheduler settings are typed operational configuration, not tenant-editable domain settings.

## Registry projection
Registry receives capabilities, resource/permission catalog, route-to-permission mapping and setting **metadata/schema**, not tenant setting values. It also receives context schema/version and ownership classification.

## Tests
CI enforces catalog uniqueness, route/application-command permission coverage, setting schema validation/version migration, security-sensitive setting authorization/audit/context-version bump, and no product-specific scope leakage into Tenant.