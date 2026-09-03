# Canonical Package Plan Index

Every reusable package has exactly one comprehensive implementation plan under this tree. A file is canonical only when it defines ownership, public API, source layout, adapters/providers, configuration, security, tenancy, failure/recovery, observability, persistence where applicable, testing, versioning and completion criteria.

## Base
`contracts`, `container`, `support`, `errors`, `config`, `logger`, `observability`, `storage`, `cache`, `database`, `orm`, `schema`, `pagination`, `state-machine`, `pipeline`, `http`, `nats`, `realtime`, `link`, `events`, `security`, `coordinator`

## Capabilities
`identity`, `tracking`, `workflow`, `sync`

## Runtime
`node`, `nestjs`, `browser`, `react`, `react-native`, `desktop`, `worker`

## UI
`router`, `navigation`, `i18n`, `theming`, `ui`

## Ownership rules
- Business/domain implementations belong to services.
- `@stackra/workflow` is the workflow definition/execution SDK; durable orchestration belongs to the Workflow service.
- Service workers, consumers and schedulers are roles of their owning NestJS service. Independent workers require an ADR.
- Cross-service DTOs, commands, queries, events and errors belong to `@stackra/contracts`.
- Cache is ephemeral; durable state belongs to database/object storage.
- Observability is operational telemetry; Audit is a domain record of security/compliance-relevant actions.
- Runtime packages adapt platform capabilities; they do not become alternate application frameworks.

## Completeness gate
No package plan may contain a placeholder architecture, unresolved driver, fake production provider, `TODO`, `TBD`, or “define later” contract. Every public symbol must have a type, behavior, failure semantics and conformance tests specified before implementation.
