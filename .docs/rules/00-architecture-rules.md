# Architecture Rules

## Rule 1 — One owner

Every important entity has one authoritative service.

## Rule 2 — No cross-service database writes

Use API/events.

## Rule 3 — Authentication != authorization

Supabase Auth authenticates. Figentra IAM authorizes.

## Rule 4 — No Person/User by default

Introduce a new identity abstraction only when a concrete requirement proves it
necessary.

## Rule 5 — Principal is universal

Humans, services, integrations, systems and agents use Principals.

## Rule 6 — Scope is generic

Business hierarchy belongs to application-defined Scope.

## Rule 7 — Permission is not entitlement

Commercial capability and authorization remain separate.

## Rule 8 — Permission is not approval

Approval is a workflow/state transition.

## Rule 9 — Feature flag is not entitlement

Feature flags control rollout; entitlements control commercial capability.

## Rule 10 — Events are contracts

Never treat an event as an unversioned internal implementation detail.

## Rule 11 — Idempotency

All retried commands and event consumers must be safely idempotent.

## Rule 12 — Least privilege

Every principal receives only the permissions required.

## Rule 13 — No implicit trust

Network location does not make a request trusted.

## Rule 14 — No client authority

Clients cannot choose their own tenant/principal/scope authorization context.

## Rule 15 — No accidental microservices

A module is not automatically a deployment.

## Rule 16 — No technology-driven architecture

Choose infrastructure based on workload characteristics.

## Rule 17 — No SDUI

Do not reintroduce server-driven UI without an explicit ADR.

## Rule 18 — Provider isolation

Provider-specific models do not leak into core domain contracts.

## Rule 19 — Version everything public

Public APIs/events/webhooks/manifests require version management.

## Rule 20 — Audit privileged actions

Security-sensitive operations must be attributable and auditable.
