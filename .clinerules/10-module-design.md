# Cline Rule: Module Design

## Vertical ownership
Every module owns its complete business capability. Keep domain invariants close to domain objects; keep orchestration in application services; keep persistence/provider details behind ports.

## Required layers
```text
<module>/
  domain/          entities, value objects, domain services, invariants
  application/     commands, queries, handlers, use cases
  infrastructure/ repositories, persistence, external adapters
  presentation/   controllers, DTOs, serializers, guards where owned
  messaging/      events, commands, consumers, publishers
  jobs/            durable asynchronous jobs owned by the module
  schedules/       scheduled entry points owned by the module
  module.ts        dependency registration and exports
```
Use additional directories only when they clarify a real responsibility.

## Dependency direction
Presentation → application → domain. Infrastructure implements ports defined by domain/application boundaries. Messaging/jobs/schedules invoke application use cases; they do not contain business rules.

## Cross-module collaboration
Use explicit public application contracts, shared contracts, domain events, commands, or typed clients. Never import another module's private repository, ORM entity, provider, migration, controller, or infrastructure implementation.

## Data ownership
A module owns its tables and repositories. Never write another module's tables. Prefer opaque IDs across boundaries. Cross-module reads must use an explicit query/API/projection contract.

## Transactions
Business state changes and their transactional outbox records must commit atomically. Do not publish a durable event before the owning transaction commits.

## Domain rules
Validate input at the transport boundary, but enforce invariants again in the domain/application layer. Never rely on controllers or frontend validation for correctness.

## Public API
Export only intentional module contracts. Keep internal symbols private. Every exported command/query/event/error should have a stable contract and tests.

## Configuration
Configuration is typed, validated at startup, and injected. Secrets come from the runtime secret provider; never hardcode them or commit them.

## Testing
Every module needs domain unit tests, application tests, persistence/integration tests where applicable, messaging/job/scheduler tests where applicable, authorization/tenancy tests, and at least one end-to-end path for externally visible behavior.
