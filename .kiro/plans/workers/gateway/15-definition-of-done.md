---
status: canonical
document: gateway-definition-of-done
worker: gateway
version: v1
---
# API Gateway — Production Definition of Done

The Gateway is production-ready only when all gates are implemented and proven in staging using the real Cloudflare Worker runtime.

- [ ] Runtime is Cloudflare Worker + Hono; no NestJS/container/ORM/business database is introduced.
- [ ] Every public route is either a Gateway utility route or a validated Registry-declared route; no arbitrary/open proxy exists.
- [ ] Host/application/environment/method/path resolution is deterministic and versioned.
- [ ] Registry last-known-good snapshot, freshness window, invalidation and fail-closed unknown-route behavior are implemented/tested.
- [ ] Service Binding and authenticated HTTPS upstreams both have explicit timeout/cancellation/header/origin-auth policies.
- [ ] Public/internal/hop-by-hop headers are stripped/rewritten correctly; client cannot forge internal Figentra context.
- [ ] Request/correlation IDs and W3C trace context are normalized once at edge and propagated to services.
- [ ] JWT prevalidation covers algorithm/issuer/audience/signature/kid/expiry/not-before/skew/JWKS rotation and never becomes final IAM/session authority.
- [ ] CORS, public security headers, request limits, smuggling normalization, WAF/bot/abuse controls and route-level edge rate limits are enforced.
- [ ] Service-local authorization, DTO validation, domain limits and idempotency remain required and are not bypassed by Gateway metadata.
- [ ] Retry happens only for safe/idempotent routes under remaining deadline; mutations are never blindly duplicated.
- [ ] Circuit/overload/backpressure policies prevent cascading failure.
- [ ] Edge caching is explicit, tenant/auth-safe, versioned and never caches unsafe mutable/private responses by default.
- [ ] WebSocket, SSE and streamed responses preserve cancellation/backpressure/auth context; reconnect semantics remain service/domain-owned.
- [ ] Upload/download limits, raw webhook-body preservation and direct file handoff flows are tested.
- [ ] Gateway transport errors are stable; service domain errors/statuses are preserved safely.
- [ ] Access logs are one structured edge record per request with secret/body/query redaction; metrics avoid unbounded cardinality; traces link downstream spans.
- [ ] Observability distinguishes Gateway failures from upstream-service failures and includes route/auth/rate/cache/Registry/realtime/file/circuit SLOs/alerts.
- [ ] Wrangler configuration has isolated dev/staging/prod bindings/secrets and immutable build/version metadata.
- [ ] Canary, rollback, secret rotation, Registry outage, JWKS outage, upstream outage and emergency route-disable runbooks have been exercised.
- [ ] Unit, integration, contract, security, E2E, load, chaos/failure and Cloudflare-runtime tests pass.
- [ ] Security tests prove no direct-origin bypass, forged internal header, auth downgrade, CORS bypass, cache poisoning, request smuggling, SSRF/open proxy or retry amplification.
- [ ] The five existing service plans have been reconciled with `13-service-boundary-and-redundancy.md` so public-edge controls are not falsely owned five times while service security/correctness controls remain.
- [ ] No deferred production architecture, placeholder middleware, fake Registry/provider behavior, undocumented route, magic setting, hidden binding or unresolved trust boundary remains.

Any known path to origin bypass, cross-service misrouting, client-forged trusted context, false auth acceptance, unsafe mutation retry, private cache leakage or removal of service authoritative security blocks release.