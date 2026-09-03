---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/pagination"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/support"]
---
# `@stackra/pagination` — pagination value objects

**Status:** Planned — implementation contract

## Purpose

Universal pagination primitives used by HTTP and query layers. Three paginator shapes are supported: `LengthAwarePaginator`, `SimplePaginator`, and `CursorPaginator`. All serialize through the canonical `{ data, meta, links }` response envelope.

## Non-goals

- Database-driver pagination; database/query packages fetch the data and construct the paginator.
- A mandatory cursor encoding scheme; cursors are opaque values.
- UI pagination rendering.

## Public API — locked

```ts
class PaginationRequest {
  readonly page: number;
  readonly cursor: string | null;
  readonly perPage: number;
  readonly sort: ISortField[];
  readonly filters: Record<string, IFilterClause>;

  static from(input: { url: URL } | { query: Record<string, string> }): PaginationRequest;
  static empty(): PaginationRequest;
}

class LengthAwarePaginator<T> {
  constructor(opts: { items:T[]; total:number; perPage:number; currentPage:number });
  items(): T[]; total(): number; perPage(): number; currentPage(): number;
  lastPage(): number; hasMorePages(): boolean; from(): number; to(): number;
  toJSON(): LengthAwarePage<T>;
}

class SimplePaginator<T> {
  constructor(opts: { items:T[]; perPage:number; currentPage:number; hasMore:boolean });
  items(): T[]; perPage(): number; currentPage(): number; hasMorePages(): boolean;
  toJSON(): SimplePage<T>;
}

class CursorPaginator<T> {
  constructor(opts: { items:T[]; perPage:number; nextCursor:string|null; prevCursor:string|null });
  items(): T[]; perPage(): number; nextCursor(): string|null; prevCursor(): string|null;
  hasNextPage(): boolean; hasPrevPage(): boolean; toJSON(): CursorPage<T>;
}

class LinkBuilder {
  constructor(opts: { baseUrl:string; request:PaginationRequest; navigationKey:"page"|"cursor" });
  build(overrides: { page?:number; cursor?:string|null }): string;
}
```

`PaginationRequest` parses `page`, `per_page`, opaque `cursor`, comma-delimited `sort`, and typed `filter[...]` expressions. Default page size is 15; maximum is 200. Consumers may explicitly configure a lower endpoint-specific maximum.

## Filter semantics

Supported operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `like`, `between`, `null`, `notnull`. Examples:

```text
filter[status]=active
filter[age][gte]=18
filter[tags]=admin,editor
filter[created_at][between]=2024-01-01,2024-12-31
```

Parsing produces typed filter clauses. Query/database layers translate those clauses into provider-specific expressions. Pagination never executes SQL.

## Source tree

```text
packages/pagination/
├── package.json
├── src/
│   ├── index.ts
│   ├── pagination-request.ts
│   ├── paginators/{abstract.paginator.ts,length-aware.paginator.ts,simple.paginator.ts,cursor.paginator.ts,index.ts}
│   ├── link-builder.ts
│   ├── constants/{default-per-page.const.ts,max-per-page.const.ts}
│   ├── interfaces/{paginator.interface.ts,sort-field.interface.ts,filter-clause.interface.ts}
│   └── utils/{parse-sort.util.ts,parse-filter.util.ts,clamp-per-page.util.ts}
└── __tests__/unit/
```

## Serialization contract

`LengthAwarePaginator` returns current page, per-page, total, last page, first/last indexes and first/last/previous/next links. `SimplePaginator` returns page/per-page/has-more and previous/next. `CursorPaginator` returns per-page/has-more and previous/next opaque cursor links. Links preserve all existing query parameters except the navigation key being changed.

## Security and limits

Reject negative/zero page values, per-page overflow, oversized cursor/query values and unsupported sort/filter fields before query execution. The package itself does not authorize fields; service/query layers must provide an allowlist. Links must preserve canonical URL encoding and never execute untrusted schemes.

## Errors

`InvalidPaginationParameterError`, `PaginationLimitExceededError`, `InvalidSortFieldError`, `InvalidFilterOperatorError`, and `InvalidCursorError`. Errors are transport-neutral and use `@stackra/errors` serialization rules.

## Testing

Every paginator gets unit coverage for boundary pages, empty results, exact page boundaries and link generation. Request parsing tests cover all operators, malformed expressions, coercion and limits. Property tests validate link round-trips and stable cursor opacity. Target is 95% branch coverage.

## Dependencies/exports

Single root export. `@stackra/support` provides deterministic parsing helpers. Response transport formatting is compatible with the workspace response contract but this package does not depend on a web framework.

## Implementation phases

1. Scaffold and parsing contracts.
2. Abstract paginator and three concrete paginator implementations.
3. Link builder and canonical serialization.
4. Filter/sort parsing and safety limits.
5. Tests, compatibility fixtures and documentation.

## Exit criteria

- All three paginators, request parsing and link generation are implemented.
- Canonical `{ data, meta, links }` serialization is stable.
- Every documented filter operator is covered by tests.
- 95% branch coverage is achieved.
- No service implements a duplicate pagination model.
