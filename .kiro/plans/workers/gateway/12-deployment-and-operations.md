---
status: canonical
document: gateway-deployment-operations
worker: gateway
version: v1
---
# API Gateway — Deployment and Operations Contract

## Runtime
Cloudflare Worker + Hono only. Deployments are immutable Worker builds managed by Wrangler with isolated `dev`, `staging`, and `prod` environments. No NestJS container, ORM, PostgreSQL database or long-lived process state belongs to the Gateway.

## Required bindings
Environment-specific bindings may include Registry Service Binding/HTTPS endpoint, KV/Cache API namespace for safe route/JWKS metadata, rate-limit primitives, service bindings for Worker upstreams, origin-auth secret/material, observability exporters and approved configuration/secrets. Business-service databases and provider credentials are forbidden.

## Configuration
Every binding/variable is typed and validated at startup/request initialization as applicable. Required: environment, gateway version/build SHA, Registry target, manifest cache TTL/stale window, JWT issuer/audience/JWKS metadata, route timeout classes, retry policies, body/header/URL limits, CORS policies, rate-limit policies, cache policies, origin allowlist/auth, realtime/file limits, observability configuration and feature/circuit parameters.

## Deployment process
1. lint/typecheck/unit/contract/security tests;
2. generate/validate runtime manifest;
3. deploy to staging;
4. Worker-runtime integration/E2E against staging Registry/services;
5. load/latency and failure smoke tests;
6. canary production deployment;
7. compare Gateway 4xx/5xx/latency/auth/routing metrics;
8. promote or rollback immediately.

## Rollback
Previous immutable Worker build remains deployable. Registry manifests are backward compatible across rollout overlap. A Gateway rollback must not require service database changes. Route metadata incompatibility is detected before promotion.

## Health and diagnostics
`/_gateway/health` reports process/runtime/build status only. Internal operational telemetry reports Registry manifest age, last successful refresh, bound service availability summaries and circuit states without exposing internal origins/secrets publicly.

## Runbooks
Mandatory runbooks: Registry unavailable/stale snapshot, mass route-resolution failure, JWT/JWKS failure, origin authentication failure, upstream timeout surge, rate-limit/WAF false positive, cache poisoning suspicion, realtime proxy failure, file upload/download incident, Worker exception/resource limit, emergency route disable, canary rollback and credential rotation.

## Disaster/recovery
Gateway owns no business durable state, so recovery is redeployment plus restoration of safe control-plane cache/config/bindings. Last-known-good routing snapshots must be reconstructible from Registry. Secret rotation is independent from source deployment.

## Operational ownership
Gateway on-call owns edge transport/routing/security health. Upstream domain-service on-call owns business/service failures. Dashboards and alerts make this distinction explicit to prevent Gateway incidents from masking service incidents and vice versa.

## Exit gate
Production rollout is blocked if origins are publicly bypassable, Registry metadata is inconsistent, route manifest validation fails, unknown upstreams can be constructed, secrets are hardcoded, service-binding/HTTPS fallback is untested, or rollback cannot be completed without modifying business-service state.