---
status: canonical
document: gateway-boundary-and-redundancy
service: audit
version: v1
---
# Audit Service — Gateway Boundary and Redundancy Contract

## 1. Boundary
Gateway is public edge transport. Audit is the authoritative durable governance-evidence plane. Gateway must never become an audit store, alter audit semantics or decide retention/legal-hold authorization.

## 2. Request context
Gateway supplies request/correlation/trace context. Audit consumes and validates trusted propagation and never replaces a valid request ID. Producer/event context is independently validated for audit ingestion; a client cannot forge trusted evidence through headers.

## 3. Authentication/authorization
Gateway may prevalidate credentials. Audit requires authenticated Identity/service context and IAM authorization for query, export, retention, integrity and legal-hold operations. Audit independently validates service event envelopes and tenant scope. Edge admission is never final authorization.

## 4. Middleware/guards/pipes
Audit retains trusted-proxy validation, body limits, principal/tenant extraction, authentication/service-identity/IAM/tenant/assurance/export guards, strict audit-filter/time-range/export/retention/hold pipes, request/trace context, idempotency, redaction, timeout and domain/security filters. These are required for direct/internal ingress and evidence integrity.

## 5. CORS/rate limits
Gateway owns public CORS and coarse edge traffic protection. Audit retains query/export bounds, ingestion abuse controls, export throttles and integrity safeguards. No public CORS or edge policy is duplicated as an alternate authority.

## 6. Logging/tracing
Gateway logs transport facts. Audit logs operational facts without exposing audit payloads. OTel spans cover ingestion, validation, dedupe, chain append, export, integrity, NATS and jobs using propagated trace/correlation context. Telemetry is never treated as authoritative evidence.

## 7. Errors/idempotency
Gateway can normalize transport errors. Audit owns evidence/domain/integrity/export error semantics and command idempotency. Gateway forwards idempotency keys but never owns audit dedupe, chain state or export state.

## 8. Registry
Audit publishes routes/OpenAPI, accepted event schemas, consumers, DLQs, jobs, schedules, notification/realtime metadata, settings, classifications, chain schema and dependencies. Registry is metadata projection only and never stores authoritative audit records, legal-hold contents, exports or chain state. Gateway consumes route metadata.

## 9. Direct/internal ingress
Direct Audit ingress remains authenticated, tenant-isolated, schema-validated and fail-closed. No Gateway-only header is accepted as evidence provenance or authorization.

## 10. Tests
Verify Gateway propagation, forged producer/tenant/auth headers, authoritative IAM checks, event schema allowlist, dedupe, chain integrity, direct ingress, CORS/rate boundary, idempotency ownership, Registry completeness and error normalization.

## 11. Forbidden duplication
No audit persistence in Gateway; no final audit authorization at edge; no trust of edge-only provenance; no public CORS duplicate; no separate trace/request-ID universe; no Registry authority over evidence.