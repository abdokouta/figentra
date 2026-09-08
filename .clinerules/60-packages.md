# Cline Rule: Packages

## Package decomposition law
```text
CAPABILITY = PACKAGE
IMPLEMENTATION VARIANT = SUBPATH
PROVIDER = SUBPATH
RUNTIME INTEGRATION = SUBPATH
FRAMEWORK INTEGRATION = SUBPATH
TESTING = SUBPATH
```

Create a standalone package only for independent ownership, lifecycle, dependency graph, release cadence, deployment/runtime role, or architectural responsibility.

Prefer:
```text
@stackra/cache/redis
@stackra/http/network
@stackra/observability/tracing
@stackra/identity/session
@stackra/openapi/swagger
```
not a separate package for every provider or adapter.

## Technical foundations
Use the existing canonical package plan index as the source of truth. Do not create duplicate packages for an existing capability.

## Framework boundaries
NestJS integration belongs under the owning capability package or the canonical NestJS runtime foundation. Do not put business logic into framework glue.

## Contracts
Cross-module/service DTOs, commands, queries, events, errors, enums and public protocol interfaces belong in `@stackra/contracts` where they are genuinely cross-boundary. Do not use contracts to leak private implementation models.

## Dependency hygiene
Technical packages must not import business services. Business modules may depend on stable technical capabilities. Avoid cycles. Run architecture/dependency checks before completion.

## Versioning
Public package exports are compatibility surfaces. Breaking changes require an explicit versioning/migration decision and updated contract/conformance tests.
