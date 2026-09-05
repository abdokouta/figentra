# Gateway vs Service Boundary and Redundancy Standard

## Decision

Do not remove security/runtime middleware from services merely because Gateway performs related edge controls. Remove only duplicated **responsibility**, not duplicated **defense**.

| Concern | Gateway | Every NestJS service |
|---|---|---|
| Request ID | Generate if absent; propagate | Consume/validate; generate only for direct non-Gateway ingress |
| Correlation ID | Establish/propagate | Consume/validate |
| Trace | Extract/create edge span; propagate | Continue trace; create service spans |
| Access logging | Edge transport/access | Application/domain/security logging |
| Authentication | Prevalidate public token | Authoritative verification/principal resolution |
| Authorization | Coarse route admission only | Authoritative IAM decision |
| Tenant | Validate trusted routing context | Resolve/enforce tenant boundary |
| CORS | Public edge policy | Only if direct browser ingress exists; otherwise no duplicate public CORS policy |
| Security headers | Public response policy | Apply service-safe headers for direct/internal responses as required |
| Rate limiting | Global/edge/route abuse | Business/resource limits where needed |
| Body limits | Edge transport limits | DTO/business limits |
| Validation | Transport shape only | Full DTO/schema/domain validation |
| Pipes | Gateway request normalization only | NestJS validation/transform pipes remain |
| Guards | Edge route/auth admission | Auth, IAM, resource guards remain |
| Interceptors | Edge telemetry/transport | Transaction, application telemetry, serialization and service-specific behavior remain |
| Filters | Gateway transport errors | Domain/application error filters remain |
| Compression/cache | Edge transport | Service-specific semantics where required |

## Critical rule

A service must remain secure and semantically correct if called by another trusted platform component without the public Gateway. Therefore authentication, authorization, tenant isolation, DTO validation, domain invariants, error mapping and application observability stay in services.

## What should be centralized

Do not make five services independently implement public CORS policy, public IP rate limiting, edge route matching, origin protection, public access logs, Cloudflare-specific headers, or public host resolution.

## What should not be centralized

Do not move business validation, IAM decisions, domain error handling, transactions, tenant authorization, business idempotency, audit semantics, provider verification or domain logging into the Gateway.

## Request ID rule

One request has one canonical request ID. Gateway owns creation at public ingress. Services propagate it. A service receiving direct internal traffic may create an ID because no trusted upstream exists, but it must never replace an existing valid one.

## Logging rule

Gateway: `request -> route -> upstream -> status -> latency`.
Service: `principal -> command/query -> domain outcome -> persistence/event`.

This prevents both missing business telemetry and duplicate access logs from becoming a design error.
