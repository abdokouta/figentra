# Audit Service Plan

Canonical production plan set for the durable Audit governance-evidence plane.

- `01-architecture.md` through `21-definition-of-done.md` — canonical implementation contract.
- `22-gateway-boundary-and-redundancy.md` — Gateway/service responsibility split.

Audit is durable evidence, not application logging, OpenTelemetry, tracking, analytics, authorization or notification delivery. Records are immutable and tenant-isolated.

## Gateway boundary
Gateway owns public edge routing, WAF/CORS, coarse edge controls, transport normalization and propagation. Audit retains service-side authentication context, IAM authorization, tenant isolation, evidence provenance, schema validation, query/export bounds, idempotency and direct/internal-ingress security. Gateway cannot establish trusted audit provenance.

Registry is metadata projection only and never stores authoritative audit records, legal-hold contents or exports. All documents form one implementation contract and must not introduce competing edge authority, mirrored workers or deferred day-one architecture.