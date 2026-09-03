# Canonical Package Plan Index

All reusable package plans live under this namespace.

## Base
- contracts
- container
- support
- errors
- config
- logger
- observability
- storage
- cache
- database
- orm
- schema
- pagination
- state-machine
- pipeline
- http
- nats
- realtime
- link

## Capabilities
- identity
- tracking

## Runtime
- node
- nestjs
- browser
- react
- react-native
- desktop
- worker

## UI
- router
- navigation
- i18n
- theming
- ui

## Ownership
Business/domain implementations belong to services. Service workers are roles of their owning NestJS service. Independent top-level workers require an ADR. Cross-service contracts belong to `@stackra/contracts`.

See `.kiro/plans/02-plan-audit-and-completeness.md` for the completeness/ownership audit and `.kiro/plans/03-12-month-implementation-sequence.md` for implementation order.
