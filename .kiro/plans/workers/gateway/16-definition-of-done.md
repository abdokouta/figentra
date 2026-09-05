# API Gateway — Definition of Done

The Gateway is production-complete only when all items below are true.

- [ ] Cloudflare Worker + Hono runtime implemented.
- [ ] No NestJS business runtime introduced.
- [ ] Public hosts and route table are Registry-driven and validated.
- [ ] Service Bindings and authenticated HTTPS upstreams are implemented.
- [ ] Deterministic middleware order is implemented.
- [ ] Request/correlation/trace IDs are generated/propagated exactly once.
- [ ] Authentication prevalidation and service-side authoritative verification are both enforced.
- [ ] No final IAM authorization is performed solely at edge.
- [ ] Tenant/application spoofing is rejected.
- [ ] CORS, security headers and transport limits are complete.
- [ ] Edge rate limiting and origin protection are complete.
- [ ] Cache policy prevents cross-tenant/user leakage.
- [ ] Webhook, SSE, WebSocket, upload and download transport paths are covered where declared.
- [ ] Every route has timeout/retry/cache/rate-limit/security metadata.
- [ ] Every retry policy is safety-classified.
- [ ] Registry failure and stale metadata behavior is deterministic.
- [ ] All gateway errors have stable public codes.
- [ ] Gateway logs never contain credentials or unsafe bodies.
- [ ] OTel/request/correlation propagation is verified end-to-end.
- [ ] Unit, integration, contract, E2E, security, load and failure tests pass.
- [ ] Worker-runtime tests run against real Cloudflare-compatible semantics.
- [ ] Development/staging/production are isolated.
- [ ] Secrets are bindings, never source.
- [ ] Rollback is tested.
- [ ] Operational runbooks exist for route, Registry, auth, rate-limit and origin incidents.
- [ ] All 14 services have the Gateway/service middleware split applied.
- [ ] No undocumented middleware, route, binding, consumer, setting or upstream exists.
- [ ] No placeholder adapter, fake provider, TODO architecture or deferred day-one production requirement remains.
