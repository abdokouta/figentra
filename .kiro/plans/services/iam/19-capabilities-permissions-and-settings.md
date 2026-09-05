---
status: canonical
document: service-capabilities-permissions-settings
service: iam
version: v1
---
# IAM Service — Capabilities, Permissions and Settings Catalog

## Capabilities
`iam.authorization.check`, `iam.authorization.check-many`, `iam.role.manage`, `iam.permission.catalog`, `iam.policy.manage`, `iam.grant.manage`, `iam.resource-context.evaluate`, `iam.authorization-model.version`.

## Control-plane permissions
- `iam.role.read`, `iam.role.create`, `iam.role.update`, `iam.role.delete`, `iam.role.assign`, `iam.role.revoke`
- `iam.permission.read`
- `iam.policy.read`, `iam.policy.create`, `iam.policy.update`, `iam.policy.publish`, `iam.policy.disable`
- `iam.grant.read`, `iam.grant.create`, `iam.grant.revoke`
- `iam.authorization.check` for approved service identities/administrative tools
- `iam.authorization.decision.read` where decision history is retained
- `iam.catalog.manage` only for controlled platform bootstrap/migration identity, not ordinary tenant admins

Permission keys are immutable and globally unique. Each key includes owner, description, action/resource mapping, risk classification and lifecycle status in the catalog.

## Resource/action catalog
Resource types include `role`, `permission`, `policy`, `grant`, `authorization-decision`, plus cross-service resource types referenced opaquely. Actions are canonical verbs and cannot be invented dynamically by clients.

## Settings
Evaluator settings: AST limits, max batch, max hierarchy depth, evaluation timeout, cache TTL, invalidation-lag ceiling, model-version policy, grant maximum duration, decision-record policy.
Operational: outbox/consumer batches, expiry scan cadence, rebuild limits, request/service rate limits, privileged-assurance level, Registry refresh/retry and observability configuration.

Settings are typed and safety-bounded. No tenant-configurable setting may weaken deny-by-default, explicit-deny precedence, tenant isolation or evaluator sandboxing.

## Registry
Registry receives capabilities, permission/resource/action catalogs, route-to-permission mapping, settings schema and evaluator schema/model versions. It never stores grants, roles, policies or authorization decisions as authoritative state.

## Coverage tests
CI fails for routes/application commands without declared authorization metadata, duplicate permission keys, unused catalog keys without explicit deprecation, uncatalogued resource/action strings, unsafe setting ranges or Registry projection drift.