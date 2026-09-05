# Testing Contract

## Unit

Test hostname normalization, route matching/precedence, manifest validation, context creation, request ID generation/validation, header policy, CORS, rate-limit key construction, authentication claim validation, upstream selection, retry classification, timeout calculation and error mapping.

## Integration

Run against the actual Worker-compatible runtime where possible. Test Registry retrieval/cache refresh, Service Bindings, authenticated HTTPS upstreams, KV/Durable/edge rate controls where used, streaming and WebSocket upgrades, and configuration/secrets bindings.

## Contract

Verify Registry route schema, service error envelope compatibility, context/header propagation, OpenAPI route metadata, authentication claim contract and health/readiness behavior.

## E2E

Public route -> Gateway -> each of the 14 service classes; public and protected routes; tenant routing; invalid token; expired token; unknown host; unknown route; disabled route; upstream 4xx/5xx; timeout; retry-safe request; non-retryable write; webhook; upload/download; SSE; WebSocket.

## Security

Token forgery, wrong issuer/audience, invalid signature, algorithm confusion, replay, tenant spoofing, header spoofing, origin disclosure, SSRF, request smuggling, oversized payloads, CORS abuse, cache poisoning, rate-limit bypass and credential leakage.

## Resilience/load

Registry outage, stale metadata, upstream outage, timeout storm, binding failure, Worker restart, concurrent bursts, streaming concurrency, rate-limit saturation and recovery. Verify p95/p99 latency, error budget and origin protection.

## Deployment smoke

Every environment deployment verifies DNS/route resolution, Registry refresh, authentication, representative public API calls, error handling, request/trace propagation and rollback.
