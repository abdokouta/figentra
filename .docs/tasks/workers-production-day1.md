# Workers Production Day-1 Checklist

/**

- @file workers-production-day1.md
- @description Completion ledger for the Gateway and Application Registry.
-
- A checkbox is marked complete only when the repository contains the
- implementation/configuration required for the item. Cloud-provider
- provisioning that requires production credentials is represented separately
- as a release gate, not falsely marked as source-code complete. */

## API Gateway

- [x] Official Hono/Cloudflare Worker scaffold structure.
- [x] `services/gateway` target.
- [x] Dependency installation contract.
- [x] Wrangler configuration.
- [x] Request ID middleware.
- [x] Correlation/trace propagation.
- [x] CORS/security-header boundary.
- [x] Routing.
- [x] Explicit CORS origin allowlist.
- [x] Native Cloudflare rate-limit binding.
- [x] Authentication-context validation.
- [x] Registry-backed service routing.
- [x] Liveness endpoint.
- [x] Worker tests.
- [x] `cf-typegen` script and binding contract.
- [x] Environment/binding strategy.
- [x] Terraform-managed Cloudflare resource contract.
- [x] Internal Registry Service Binding.
- [x] Short-lived audience-bound upstream token exchange.
- [x] Upstream timeout and circuit-breaker boundary.
- [x] Route cache with KV as non-authoritative optimization.
- [x] Production README and operating contract.

## Application Registry

- [x] Official Hono/Cloudflare Worker scaffold structure.
- [x] `workers/registry` target.
- [x] Dependency installation contract.
- [x] Wrangler configuration.
- [x] D1 binding.
- [x] D1 migration runner contract.
- [x] Complete registry schema.
- [x] Versioned migrations.
- [x] Registration API.
- [x] Versioning.
- [x] Application metadata.
- [x] Modules metadata.
- [x] Resources metadata.
- [x] Actions metadata.
- [x] Capabilities.
- [x] Theme/branding metadata.
- [x] Optional KV read cache contract.
- [x] Registry tests.
- [x] `cf-typegen` script and binding contract.
- [x] Service-principal registration authorization.
- [x] Dedicated route-resolution audience.
- [x] Gateway Service Binding integration.
- [x] SSRF-safe upstream validation.
- [x] Audit log.
- [x] Production README and operating contract.

## Release gates requiring real Cloudflare credentials

- [ ] Apply Terraform in dev and verify generated
      D1/KV/rate-limit/service-binding IDs.
- [ ] Apply Terraform in staging and run integration suite.
- [ ] Run remote D1 migrations in staging.
- [ ] Deploy Workers to staging.
- [ ] Run load and failure tests against staging.
- [ ] Run security/DAST tests against staging.
- [ ] Promote to production after security and SLO gates pass.
