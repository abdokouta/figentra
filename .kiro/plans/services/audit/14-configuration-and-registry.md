---
status: canonical
document: service-configuration-registry
service: audit
version: v1
---
# Audit Service — Configuration and Application Registry Contract

## Configuration
Typed settings include service/version/environment/runtime role; HTTP/shutdown/query timeouts; PostgreSQL; NATS; object storage/KMS; bounded Redis; chain partitioning/algorithm/canonicalization; query/page/export limits; integrity/retention/archive/delete; legal hold; export formats/expiry; quarantine; rate/assurance; OTel; Registry connection/refresh/retry. Secrets are secret-manager references only.

## Registry projection
Audit registers service/modules/capabilities/runtime roles, query/export/integrity/retention/legal-hold routes/OpenAPI, IAM permissions/resource types, accepted event subjects/schema versions, consumers/quarantine/DLQs, jobs/schedules, notifications/realtime, export/classification controls, chain schema versions, settings, health and dependency graph. Registry never stores authoritative audit records, legal-hold contents, exports or secret values.

## Gateway boundary metadata
Registry distinguishes edge admission from Audit-authoritative authorization/evidence validation. Gateway may route and prevalidate, but Audit independently validates Identity/service context, tenant scope and event provenance. Public CORS/WAF/coarse edge limits remain Gateway-owned. Request/trace propagation is declared; valid IDs are never replaced. No Registry metadata can establish evidence provenance or authorization.

## Source event allowlist
Accepted event types/versions and classification constraints are code/contract-managed and projected to Registry. Unlisted events are not silently accepted as trusted evidence.

## Registration
Manifest is deterministic/idempotent. Duplicate subject ownership, unsupported chain versions, conflicting permissions/schedules or missing bindings fail local validation. Registry outage does not block Audit.

## Tests
Config safety, no-secret projection, source allowlist, manifest snapshots, Gateway route-consumption contracts, forged provenance/header rejection, direct-ingress security and edge-vs-service authorization boundaries are required.