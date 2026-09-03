# Package 13 — Search

**Status:** Normative / implementation locked
**Package:** `@stackra/search`

## Decision

`@stackra/search` is the single provider-neutral search capability. Browser and React Native clients use typed authenticated HTTP/OpenAPI. Search-engine SDKs are backend-only package subpaths and are never imported by applications.

## Exports

```text
@stackra/search
@stackra/search/http
@stackra/search/react
@stackra/search/react-native
@stackra/search/nestjs
@stackra/search/meilisearch
@stackra/search/elasticsearch
@stackra/search/algolia
@stackra/search/testing
```

## Provider rule

The Search service is the only business-facing owner of index state and provider execution. `@stackra/search/meilisearch` uses the Meilisearch JavaScript client; `@stackra/search/elasticsearch` uses the Elasticsearch client; `@stackra/search/algolia` uses Algolia where enabled. Vendor DSLs terminate inside these adapters.

## Client path

```text
React / React Native
 → @stackra/search/http
 → Gateway
 → Search API
 → IAM + tenant constraints
 → portable query compiler
 → provider adapter
 → SearchResult
```

Clients receive typed items/facets/highlights/cursors and never receive engine credentials.

## Index path

```text
source service transaction
 → transactional outbox
 → NATS JetStream
 → Search consumer
 → idempotent IndexJob
 → provider bulk/index/delete
 → source-version guard
```

Stale updates are discarded; delete tombstones prevent resurrection.

## Rebuild

New physical index version → snapshot → event replay → checksum/count validation → smoke/conformance tests → fenced alias cutover → rollback retention → retirement.

## Security

Index documents are allowlisted and classified. Query fields, filters, facets, sorts and page sizes are allowlisted. Tenant context is injected server-side. Restricted PII/secrets/provider credentials are rejected.

## Testing

All adapters run the same conformance suite. Release acceptance requires at least one real provider plus a real NestJS HTTP path and React/React Native client integration tests. Required failure tests cover provider outage, stale events, deletes, rebuild crash/recovery, alias fencing and tenant isolation.

## Cross-reference

See `.kiro/plans/packages/capabilities/search.md` and `.kiro/plans/services/search.md`.
