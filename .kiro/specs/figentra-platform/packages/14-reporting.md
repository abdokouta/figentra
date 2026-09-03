# Package 14 — Reporting

**Status:** Normative / implementation locked
**Package:** `@stackra/reporting`

## Decision

Reporting is a provider-neutral client and report-definition contract. The Reporting service owns durable definitions, revisions, datasets, read models, execution and exports. Custom reports are authored through a typed dataset/query AST; raw SQL is never a client contract.

## Exports

```text
@stackra/reporting
@stackra/reporting/http
@stackra/reporting/react
@stackra/reporting/native
@stackra/reporting/nestjs
@stackra/reporting/testing
```

## Custom-report path

```text
React/Native Report Builder
 → dataset catalog
 → typed fields/filters/grouping/aggregation
 → preview through production compiler
 → save immutable definition revision
 → query/export/schedule
 → Reporting API
 → authorized read model / Analytics contract
 → ReportResult
```

A dataset is a trusted, versioned read surface with explicit fields, relations, operators, aggregations and authorization profile. Users may combine only those approved parts.

## Query AST

The portable AST contains typed field references, literals, comparison/range predicates, boolean groups, aggregates, grouping, sorting and approved calculated fields. Unknown fields, type mismatches, unbounded cardinality, excessive nesting and unsupported operations fail validation.

## Exports

CSV/JSON are baseline. XLSX/PDF are optional exporters behind explicit capability registrations. Large exports are durable jobs through Files/object storage, checksummed, resumable and served through short-lived signed URLs.

## Dashboard integration

Dashboard widgets reference `reportKey + parameterSchema + presentationHint`. The widget never stores or executes SQL.

## Security

Tenant context and IAM field permissions are injected server-side. Preview, query, export and scheduled execution use the same policy. Report definitions cannot contain SQL, provider credentials, filesystem paths or arbitrary network instructions.

## Testing

Required coverage includes dataset catalog filtering, AST security, custom-definition lifecycle, preview/query/export, tenant and field isolation, revision immutability, read-model replay, job retry/resume and Dashboard E2E.

## Cross-reference

See `.kiro/plans/packages/capabilities/reporting.md`, `.kiro/plans/services/reporting.md` and `.kiro/plans/2026-09-03-search-reporting-dashboard-seo-e2e-plan.md`.
