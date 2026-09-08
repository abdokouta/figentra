# Search — Architecture

Search is an event-driven read/projection service. Authoritative data remains in domain services. Domain events are consumed through the platform event backbone; Search transforms them into denormalized search documents in provider-owned indexes.

Pipeline: domain event → ingestion consumer → projection resolver → normalization → index writer → alias-visible search index.

The service supports `global`, `resource`, `autocomplete`, `suggest`, and `exact` query modes. Global search searches only registered resource types and returns a discriminated result envelope (`resourceType`, `id`, `title`, `subtitle`, `url`, `score`, `highlights`, `facets`).

Search never becomes a generic data-access API. Fetch-by-id remains owned by the source service.

Initial provider: OpenSearch via `SearchProviderOpenSearchAdapter`. Provider-neutral application contracts remain mandatory so a later Algolia/Meilisearch adapter can replace the implementation without changing controllers or domain semantics.

Search and Reporting may share one OpenSearch cluster/domain initially, but they have independent index namespaces and ownership boundaries.