---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/reporting'
---

# `@stackra/reporting` — typed report definition and execution client

## Purpose

Provide one provider-neutral contract for applications, React dashboards and React Native clients to browse report definitions, construct safe report queries, execute reports, poll asynchronous jobs and download exports. The Reporting service owns report definitions, read models, execution authorization and durable exports; this package is the client/contract boundary.

## Subpaths

```text
@stackra/reporting
@stackra/reporting/react
@stackra/reporting/native
@stackra/reporting/nestjs
@stackra/reporting/http
@stackra/reporting/testing
```

The package never exposes raw SQL, ORM entities or database-specific query APIs to clients.

## Contract model

```ts
interface ReportDefinition {
  key: string;
  version: number;
  title: LocalizedText;
  description?: LocalizedText;
  columns: readonly ReportColumn[];
  filters: readonly ReportFilterDefinition[];
  sorts: readonly ReportSortDefinition[];
  capabilities: ReportCapabilities;
}

interface ReportQuery {
  filters: readonly ReportFilter[];
  sort?: readonly ReportSort[];
  page?: PaginationRequest;
  fields?: readonly string[];
}

interface ReportResult<T> {
  columns: readonly ReportColumn[];
  rows: readonly T[];
  page: PaginationView;
  generatedAt: string;
}
```

## Custom reports

Custom reporting is definition-driven rather than SQL-driven.

A tenant/admin user creates a report by selecting an approved dataset and composing:

```text
Dataset
 → fields
 → calculated fields (allow-listed expressions)
 → filters
 → grouping
 → aggregations
 → sorting
 → presentation columns
 → authorization profile
 → schedule/export options
```

The service compiles this into a versioned report definition. Every dataset/field/join/operator must be explicitly registered by a trusted application/service. Users cannot introduce arbitrary joins, table names, SQL, shell commands or provider credentials.

## Report builder flow

```text
GET datasets
    ↓
select fields/aggregations
    ↓
validate filter operators
    ↓
preview query
    ↓
save definition revision
    ↓
run / export / schedule
```

Preview uses the same production query compiler with stricter row/time budgets.

## Query language

The package uses a typed AST:

```text
Comparison
Between
In
Contains
Prefix
Exists
DateRelative
And / Or / Not
Aggregate
GroupBy
OrderBy
```

Calculated expressions are limited to registered functions such as arithmetic, conditional expressions and date bucketing. Division-by-zero, overflow and invalid types produce typed validation errors.

## React integration

Exports include:

```text
ReportProvider
useReports
useReport
useReportQuery
useReportExport
ReportTable
ReportBuilder
FilterBuilder
ColumnPicker
ReportChartAdapter
```

The builder consumes server-provided definitions and capability metadata so the UI automatically hides unsupported operators/fields.

## Native integration

`/native` provides hooks and primitives for report lists, filter sheets, result tables and export status. Native clients never embed a SQL/query engine.

## HTTP transport

`/http` exposes a typed client built on `@stackra/http`. Endpoints support query, preview, exports, schedules and job status. Pagination uses `@stackra/pagination`.

## NestJS integration

`/nestjs` exposes DTO/schema/validation/controller helpers for services or application backends that host reporting endpoints. It does not create Reporting persistence in the package.

## Execution semantics

Small queries execute synchronously under configured budgets. Large or expensive queries return a durable job reference. Execution captures report definition version and authorization context so retries cannot accidentally use a changed definition.

## Exports

Supported formats are capability-gated:

```text
CSV
JSON
XLSX (when the host enables the exporter)
PDF (when a trusted renderer is configured)
```

Exports above size/time thresholds are asynchronous and written through Files/object storage. Clients receive short-lived signed download references.

## Dashboard integration

Dashboard widgets should consume report keys and typed parameter schemas, not embed query implementations. A dashboard widget can therefore change from one report provider to another without changing the dashboard document format.

## Caching

Read-only report definition metadata is cacheable. Query result caching is opt-in and keyed by tenant, principal authorization profile, definition version, query hash and data freshness/version. Personalized data is never shared across principals unless the authorization contract explicitly permits it.

## Authorization and tenancy

Every request carries RequestContext. The backend injects tenant predicates and field authorization during query compilation. A client-provided tenant identifier is not an authorization mechanism. Cross-tenant reports require explicit platform privileges.

## Reliability

Queries have cancellation, timeout and resource budgets. Job execution is idempotent by job/attempt identity. Large exports are resumable. Failed provider/object-storage dependencies remain retryable while the source definition remains unchanged.

## Observability

Metrics cover definition validation, preview/query latency, rows/bytes scanned, asynchronous job lag, export throughput and failure rates. SQL-like generated plans are never emitted to logs when they could contain protected schema information.

## Testing

Definition/compiler tests; filter AST security; tenant/field isolation; React builder parity; native builder tests; pagination; query cancellation/budgets; export checksum/expiry; stale definition versions; job retry idempotency; real NestJS HTTP integration and representative production database query plans.

## Completion criteria

Custom reports can be created entirely through the typed builder, previewed with the production compiler, persisted as immutable revisions, executed under tenant/IAM constraints, embedded in dashboards, scheduled and exported without exposing raw SQL or ORM internals.
