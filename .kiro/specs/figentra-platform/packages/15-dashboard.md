# Package 15 — Dashboard

**Status:** Normative / implementation locked
**Package:** `@stackra/dashboard`

## Decision

Dashboard is a reusable cross-runtime capability, not a microservice. It owns dashboard/widget/layout/presentation contracts. Host application services own persistence and business data through `@stackra/dashboard/nestjs`.

## Exports

```text
@stackra/dashboard
@stackra/dashboard/react
@stackra/dashboard/native
@stackra/dashboard/nestjs
@stackra/dashboard/testing
```

## Backend persistence contract

`/nestjs` exports `DashboardModule`, `DashboardPersistenceAdapter`, DTOs, repository/controller factories, authorization integration and revision/share/embed contracts. Persistence is injected so the host service can use its own ORM and database.

Required operations: list/get/create/update/delete, create revision, publish, restore, share-grant CRUD and embed-token issuance/revocation. Mutations use expected-version optimistic locking.

## Runtime path

```text
React/Native
 → Dashboard client
 → Gateway/host API
 → host NestJS service
 → @stackra/dashboard/nestjs
 → dashboards + immutable revisions + grants/tokens
 → typed response
 → widget registry
 → reporting/search/analytics data clients
 → renderer
```

## Widget model

Widgets declare stable key/version, config schema, data contract, capabilities/permissions and renderer requirements. Widgets do not access domain databases or vendor providers directly.

## Layout/customizer

Canonical layout is breakpoint-aware and constraint-based. The editor supports widget catalogue/cohorts, add/remove/reorder/span, settings, filters, presets and responsive layouts. DOM coordinates are not persisted.

## Sharing

Visibility and share level are distinct. Public embeds are read-only, revocable and tokenized; tenant/role sharing is evaluated by IAM. Token secrets are hashed at rest.

## Testing

Conformance covers registry/catalogue, layout determinism, responsive behavior, backend adapter CRUD/revisions, optimistic locking, tenant isolation, sharing/embed security and React/Native rendering. E2E must persist through a real NestJS application and reload a published revision.

## Cross-reference

See `.kiro/plans/packages/capabilities/dashboard.md`, `.kiro/plans/2026-09-03-search-reporting-dashboard-seo-e2e-plan.md` and the attached Dashboard Studio reference used as the feature baseline.
