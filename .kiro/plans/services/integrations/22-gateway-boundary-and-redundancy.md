---
status: canonical
document: gateway-boundary-and-redundancy
service: integrations
version: v1
---
# Integrations Service — Gateway Boundary and Redundancy Contract

## 1. Boundary
Gateway is the public edge transport boundary. Integrations is authoritative for external business-system connections, provider adapters, webhooks, sync, mappings and reconciliation. Gateway never owns provider business state.

## 2. Request context
Gateway generates missing request IDs and propagates W3C trace/correlation context. Integrations consumes and validates trusted propagation and never replaces a valid request ID. Provider webhook provenance is independently verified; Gateway context cannot replace provider signature verification.

## 3. Authentication/authorization
Gateway may prevalidate authentication. Integrations independently requires Identity/service authentication and IAM authorization for connections, credentials, sync and reconciliation. Provider webhook authenticity is an Integrations concern and cannot be delegated to generic Gateway admission.

## 4. Middleware/guards/pipes
Integrations retains trusted-proxy validation, transport/body limits, raw-body capture for signed webhooks, principal/tenant context, authentication/service-identity/tenant/IAM/assurance/webhook/ownership guards, strict provider/config/mapping/sync pipes, SSRF-safe URL validation, request/trace context, idempotency, provider telemetry, timeout, serialization and redaction filters.

## 5. CORS/rate limits
Gateway owns public CORS, edge security headers and coarse global traffic protection. Integrations retains provider-specific rate limits, outbound concurrency, webhook abuse protection, payload bounds and SSRF/egress controls. These are not redundant edge policies; they protect a different invariant.

## 6. Logging/tracing
Gateway logs transport facts. Integrations logs provider/connection/sync/reconciliation application facts with secret/body redaction. OTel spans continue across adapters, outbound HTTP, webhook verification, DB, NATS and jobs using propagated trace/correlation IDs.

## 7. Errors/idempotency
Gateway normalizes transport failures. Integrations owns provider/domain error mapping, retry classification, webhook acceptance semantics, sync/reconciliation state and idempotency/deduplication. Gateway forwards idempotency keys only.

## 8. Registry
Integrations publishes routes/OpenAPI, provider/integration capability metadata, webhook metadata, events, consumers, jobs, schedules, settings, dependencies and health metadata. Registry is projection/discovery only; Integrations remains authoritative for connections, credentials references, mappings and reconciliation state. Gateway consumes route metadata.

## 9. Direct/internal ingress
Direct Integrations ingress remains secure without Gateway. Webhooks still require provider-specific authenticity verification; internal callers require service identity; tenant and IAM checks remain authoritative.

## 10. Tests
Verify Gateway propagation, direct ingress, forged headers, provider signature verification, SSRF/egress controls, CORS/rate boundary, idempotency ownership, trace continuity, error normalization and Registry completeness.

## 11. Forbidden duplication
No provider business logic in Gateway; no final IAM authorization at edge; no trust of Gateway-only webhook provenance; no public CORS duplicate; no separate trace/request-ID universe; no Registry authority over integration state.