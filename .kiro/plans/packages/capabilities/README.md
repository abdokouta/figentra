# Capability Package Plans

Capability packages exist only when a capability is genuinely reusable across multiple bounded contexts or runtimes. A business/domain capability is **not** a package merely because it is important to the platform.

## Canonical ownership

- Domain implementations live in `services/<service>/src/modules`.
- Asynchronous execution normally lives in a worker role of the owning NestJS service, using the same source tree.
- Cross-service consumers import versioned DTOs, schemas, commands, queries, events, errors and public interfaces from `@stackra/contracts`.
- Service implementation packages such as Notifications, Analytics, Marketing and Audit are not created merely to share domain code.
- `@stackra/identity` is retained where its reusable authentication/identity SDK boundary is required.
- `@stackra/tracking` is retained where browser/mobile/desktop behavioral collection is genuinely reusable.

## Candidate reusable capabilities

Each package must pass the reuse test before creation. Technical infrastructure belongs in `packages/base`; runtime-specific integrations belong in `packages/runtime`. Domain-specific implementation belongs in a service.

This directory must never become a second home for service source code.
