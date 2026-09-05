# IAM Service — Data Model

IAM owns PostgreSQL and no other service reads its tables.

## Tables
`roles(id, tenant_id, key, name, description, status, version, timestamps)` unique `(tenant_id,key)`.

`permissions(id, key, action, resource, description, status, version)` unique `key`; published keys immutable.

`role_permissions(role_id, permission_id)` composite primary key.

`policies(id, tenant_id, effect, principal_selector, action_selector, resource_selector, conditions_ast, priority, version, status, timestamps)` with indexes on tenant/status/version/priority.

`grants(id, tenant_id, principal_id, role_id, resource_type, resource_id, scope, expires_at, status, version, timestamps)` indexed by tenant/principal/resource/action-effective scope.

`authorization_decisions(id, tenant_id, principal_id, actor_principal_id, action, resource_type, resource_id, result, reason_code, policy_version, created_at)` retained only for required decision evidence.

`outbox(event_id, aggregate_id, aggregate_type, type, version, tenant_id, payload, occurred_at, published_at, attempts, next_attempt_at, last_error)`.

## Invariants
A grant cannot reference an inactive role. A published permission key cannot be renamed. Policies use a typed AST only. Explicit deny always dominates allow. Expired grants/policies are ineffective. Every tenant-scoped query includes tenant isolation. Optimistic versioning prevents lost administrative updates.

## Transactions
Role/permission/grant/policy mutations and their outbox records commit atomically. Publication is asynchronous. Authorization reads use authoritative state or a version-valid cache.

## Indexing and retention
Indexes target authorization hot paths and administrative lists. Decision evidence follows explicit retention. No unbounded decision payload is stored. Conditions are bounded in size and depth.

## Migrations
Expand/contract only; rolling-compatible schema; migration tests and recovery procedure required. Destructive changes require a compatibility release first.