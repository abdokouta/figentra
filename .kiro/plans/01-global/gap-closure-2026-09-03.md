# 2026-09-03 Architecture Gap Closure

## Applied decisions

- Monitoring infrastructure is a first-class Docker + Terraform concern.
- OpenTelemetry is integrated through `@stackra/observability` from day one; it is not a future logger subpath.
- Audit is a service-owned bounded context with optional asynchronous worker **role**, not a package + service + worker implementation triplet.
- Audit is separate from logs, traces, domain events, tracking, analytics and authorization.
- Services, workers and apps have dedicated plan namespaces.
- Cloudflare Workers remain an explicit provider-native edge/serverless runtime; they are not the generic Figentra background-worker runtime.
- NestJS/Node.js is the canonical service and service-worker runtime.
- A service may deploy API, NATS consumer, worker and scheduler roles from one source tree; duplicated `workers/<service>` implementations are prohibited unless an ADR proves an independent boundary.
- Cross-service consumers import versioned DTOs/schemas/commands/queries/events/errors/interfaces from `@stackra/contracts`, never service implementation code.
- Durable infrastructure is Terraform-managed or explicitly declared as an external managed service.
- Environment boundaries are development/staging/production with isolated Terraform state.
- Security-sensitive mutations integrate audit; telemetry never becomes the audit system of record.
- Worker roles use explicit execution context, idempotency, retries, DLQ, replay and reconciliation where applicable.

## Package admission

The package graph is intentionally reduced to reusable technical/platform capabilities. Notifications, Analytics, Marketing and Audit are service-owned domains. Search, Media, Sync and Workflow remain packages only where their implementation is genuinely reusable and domain-neutral. Identity and Tracking remain packages where their reusable SDK/runtime boundary is real.

## Legacy cleanup

- Standalone `@stackra/auth` is removed; authentication is part of `@stackra/identity`.
- Domain implementation package plans for Notifications, Analytics and Marketing are removed.
- No superseded architecture is retained as an active target plan.
- Historical references must point to the canonical service/package owner rather than preserving competing target layouts.

## Day-one enforcement

The implementation checklist gates completion on package/service/app conformance, explicit service runtime roles, Docker image reproducibility, Terraform validation/plan/policy checks, monitoring flow tests, audit durability/idempotency/tenant isolation, contract compatibility, worker drain/restart tests and production runbooks.
