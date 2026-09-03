---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://pagination-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/pagination` — pagination value objects

**Status:** Planned **Anchor ADRs:**
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md)
**Reference:** `.ref/packages/pagination/` (`@stackra/ts-pagination` v0.1.0)
**Depends on:** `@stackra/support` (Str, Uri, Num) **Design effort:** 6 days
across 5 phases

## Purpose

Universal pagination primitives every HTTP + query layer composes. Three
paginator shapes, one abstract base:

- **`LengthAwarePaginator`** — knows total count. Best for admin lists + small
  tables. Provides `.total()`, `.lastPage()`, `.hasMorePages()`.
- **`SimplePaginator`** — knows only "has more?" via `perPage + 1` fetch. Best
  for infinite scroll — no `COUNT(*)` cost.
- **`CursorPaginator`** — cursor-based, stable across insertions. Best for large
  tables + external APIs.

Each paginator serialises to a consistent JSON envelope + parses request params
(`page`, `per_page`, `cursor`) via `PaginationRequest.from(request)`.

## Non-goals

- DB-driver-specific pagination — the paginators consume already-fetched items;
  DB packages (like `@stackra/database`) call the paginator's constructor.
- Cursor encoding schemes — the abstract cursor is opaque; consumer packages
  encode via base64 / JWT / other.
- UI rendering — pagination controls (buttons, page numbers) live in
  `@stackra/ui`; this package ships only the DATA shape.

## Public API — locked

### `PaginationRequest`

Parses query params — canonical spec:

- `page` (1-based, default 1) — LengthAware + Simple only.
- `cursor` (string, opaque) — Cursor only.
- `per_page` (default 15, max 200) — every paginator.
- `sort` (`name,-created_at` — comma-separated fields, `-` prefix descends).
- `filter[field]`, `filter[field][operator]` — parsed into typed filter object.

```typescript
class PaginationRequest {
  readonly page: number;
  readonly cursor: string | null;
  readonly perPage: number;
  readonly sort: ISortField[];
  readonly filters: Record<string, IFilterClause>;

  static from(
    input: { url: URL } | { query: Record<string, string> },
  ): PaginationRequest;
  static empty(): PaginationRequest;
}
```

### `LengthAwarePaginator<T>`

```typescript
class LengthAwarePaginator<T> {
  constructor(opts: {
    items: T[];
    total: number;
    perPage: number;
    currentPage: number;
  });

  items(): T[];
  total(): number;
  perPage(): number;
  currentPage(): number;
  lastPage(): number;
  hasMorePages(): boolean;
  from(): number; // 1-based first item index
  to(): number; // 1-based last item index

  toJSON(): {
    data: T[];
    meta: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    };
    links: {
      first: string | null;
      last: string | null;
      prev: string | null;
      next: string | null;
    };
  };
}
```

### `SimplePaginator<T>`

```typescript
class SimplePaginator<T> {
  constructor(opts: {
    items: T[];
    perPage: number;
    currentPage: number;
    hasMore: boolean;
  });

  items(): T[];
  perPage(): number;
  currentPage(): number;
  hasMorePages(): boolean;

  toJSON(): {
    data: T[];
    meta: { current_page: number; per_page: number; has_more: boolean };
    links: { prev: string | null; next: string | null };
  };
}
```

Consumers typically fetch `perPage + 1` items; if the result length equals
`perPage + 1`, drop the last item + set `hasMore: true`.

### `CursorPaginator<T>`

```typescript
class CursorPaginator<T> {
  constructor(opts: {
    items: T[];
    perPage: number;
    nextCursor: string | null;
    prevCursor: string | null;
  });

  items(): T[];
  perPage(): number;
  nextCursor(): string | null;
  prevCursor(): string | null;
  hasNextPage(): boolean;
  hasPrevPage(): boolean;

  toJSON(): {
    data: T[];
    meta: { per_page: number; has_more: boolean };
    links: { prev: string | null; next: string | null };
  };
}
```

The cursor is opaque — consumers encode/decode via `@stackra/database`'s cursor
helper OR their own scheme.

### `LinkBuilder`

Every paginator emits `first/last/prev/next` URLs. The base builder:

```typescript
class LinkBuilder {
  constructor(opts: {
    baseUrl: string;
    request: PaginationRequest;
    // Which param the paginator uses for navigation:
    navigationKey: "page" | "cursor";
  });

  build(overrides: { page?: number; cursor?: string | null }): string;
}
```

Preserves every existing query param (sort, filter, etc.) and only mutates the
navigation key.

## Subpath layout

Single-entry package.

```
packages/pagination/
├── package.json                          # single "." export
├── src/
│   ├── index.ts
│   ├── pagination-request.ts             # PaginationRequest.from()
│   ├── paginators/
│   │   ├── abstract.paginator.ts         # base w/ common serialisation
│   │   ├── length-aware.paginator.ts
│   │   ├── simple.paginator.ts
│   │   ├── cursor.paginator.ts
│   │   └── index.ts
│   ├── link-builder.ts
│   ├── constants/
│   │   ├── default-per-page.const.ts     # 15
│   │   └── max-per-page.const.ts         # 200
│   ├── interfaces/
│   │   ├── paginator.interface.ts
│   │   ├── sort-field.interface.ts
│   │   └── filter-clause.interface.ts
│   └── utils/
│       ├── parse-sort.util.ts
│       ├── parse-filter.util.ts
│       └── clamp-per-page.util.ts
└── __tests__/
    └── unit/
        ├── pagination-request.test.ts
        ├── length-aware-paginator.test.ts
        ├── simple-paginator.test.ts
        ├── cursor-paginator.test.ts
        └── link-builder.test.ts
```

## Filter clause syntax

The `PaginationRequest` parses:

- `?filter[status]=active` — `{ status: { operator: "eq", value: "active" } }`
- `?filter[age][gte]=18` — `{ age: { operator: "gte", value: 18 } }`
- `?filter[tags]=admin,editor` — comma → array —
  `{ tags: { operator: "in", value: ["admin", "editor"] } }`
- `?filter[created_at][between]=2024-01-01,2024-12-31` — range.

Supported operators: `eq` (default), `neq`, `gt`, `gte`, `lt`, `lte`, `in`,
`nin`, `like`, `between`, `null`, `notnull`.

Consumer packages (`@stackra/database`, `@stackra/http`) translate these into
their query-builder syntax.

## Phases

### Phase 1 — Scaffold (1 day)

- [ ] Package skeleton.
- [ ] `PaginationRequest.from()` w/ typed parsing.

### Phase 2 — Paginators (2 days)

- [ ] `AbstractPaginator` base.
- [ ] `LengthAwarePaginator` + `SimplePaginator` + `CursorPaginator`.

### Phase 3 — Link building (1 day)

- [ ] `LinkBuilder` preserves existing query params.
- [ ] Handles missing base URL gracefully (returns `null`).

### Phase 4 — Filter + sort parsing (1 day)

- [ ] Parse operator syntax.
- [ ] Type-coerce values (`"true"` → `true`, `"18"` → `18`, `"2024-01-01"` →
      `Date`).

### Phase 5 — Testing + docs (1 day)

- [ ] Unit test per file — 95% branch coverage.
- [ ] README documents every paginator w/ HTTP + Nest examples.

## Exit criteria

- [ ] 3 paginators + PaginationRequest + LinkBuilder shipped.
- [ ] JSON envelope matches the workspace's canonical response contract
      (`{ data, meta, links }`).
- [ ] Filter parser handles every documented operator.
- [ ] 95% branch coverage.

## Cross-refs

- `@stackra/response` — envelope structure interop.
- `@stackra/database` — the query-builder consumer.
- `@stackra/http` — the client-side consumer.
