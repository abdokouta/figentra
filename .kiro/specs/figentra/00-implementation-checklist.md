# Figentra Platform — Component Completion Checklist

Implement each component against its specification; do not claim external
runtime execution without executing it.

## Services

- [ ] services/01-approval.md
- [ ] services/02-audit.md
- [ ] services/03-entitlements.md
- [ ] services/04-files.md
- [ ] services/05-iam.md
- [ ] services/06-identity.md
- [ ] services/07-integrations.md
- [ ] services/08-monetization.md
- [ ] services/09-notifications.md
- [ ] services/10-policy.md
- [ ] services/11-reporting.md
- [ ] services/12-scope.md
- [ ] services/13-search.md
- [ ] services/14-tenant.md
- [ ] services/15-usage.md
- [ ] services/16-workflow.md

## Packages

- [ ] packages/01-contracts.md
- [ ] packages/02-events.md
- [ ] packages/03-iam.md
- [ ] packages/04-identity.md
- [ ] packages/05-messaging.md
- [ ] packages/06-observability.md
- [ ] packages/07-outbox.md
- [ ] packages/08-oxlint-config.md
- [ ] packages/09-prettier-config.md
- [ ] packages/10-registry.md
- [ ] packages/11-sdk.md
- [ ] packages/12-security.md
- [ ] packages/13-tsup-config.md
- [ ] packages/14-typescript-config.md

## Workers

- [ ] workers/01-gateway.md
- [ ] workers/02-infrastructure-orchestrator.md
- [ ] workers/01-registry.md

## Apps

- [ ] apps/01-family.md
- [ ] apps/02-landing-page.md
- [ ] apps/03-portal.md

## Stackra

- [ ] stackra/01-container.md
- [ ] stackra/02-http.md
- [ ] stackra/03-logger.md
- [ ] stackra/04-state.md
- [ ] stackra/05-testing.md
- [ ] stackra/06-tsup-config.md
- [ ] stackra/07-typescript-config.md
- [ ] stackra/08-prettier-config.md
- [ ] stackra/09-oxlint-config.md
- [ ] stackra/10-query.md

## Cross-platform gates

- [ ] Explicit package exports/subpaths
- [ ] Service clients owned by `@figentra/sdk`
- [ ] Gateway has no duplicate service clients
- [ ] Shared health package is used
- [ ] NestJS uses Fastify/Pino/Nest Observe
- [ ] Workers use Hono/Cloudflare observability; Gateway uses Nest Observe/Pino
- [ ] Apps use Sentry + Stackra logger
- [ ] Correlation/trace survives HTTP and NATS
- [ ] Event-producing services use transactional outbox
- [ ] No cross-service DB writes
- [ ] No TODO/stub/shim/fake provider
- [ ] Tests under standardized `__tests__` trees
- [ ] development/staging/production naming is consistent

## Canonical Gateway and deployment enrollment amendment

The canonical API Gateway is `services/gateway` using NestJS + Fastify. The
former Hono Gateway Worker is removed. Cloudflare remains the external
edge/WAF/DDoS layer.

Deployment catalog enrollment is explicit: the root `cloud.yaml` `paths` list is
the only local-source enrollment mechanism. The collector does not implicitly
discover apps, services, or workers outside those paths. See ADR-0082 and
ADR-0083.
