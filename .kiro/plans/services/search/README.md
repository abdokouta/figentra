# Search Service

Search is a first-class Figentra platform service for entity discovery, full-text retrieval, autocomplete, suggestions, typo tolerance, relevance, filtering, faceting, highlighting and cross-entity search experiences.

## Ownership

Search owns search projections, index schemas, analyzers, aliases, ranking policy, autocomplete dictionaries, synonym/normalization policy, query compilation, result shaping and index rebuilds. Source business services own authoritative records and emit versioned domain events.

## Provider posture

The domain/application layer is provider-agnostic through `SearchProvider`. The initial production adapter is Amazon OpenSearch Service because Figentra is AWS-primary and Reporting also uses OpenSearch. Future adapters may include Algolia or Meilisearch without changing application contracts. Provider-specific capabilities are exposed only through explicit optional capability interfaces; the common API never leaks vendor DSL.

## Core experiences

- Global dashboard search across customers, orders, projects, tasks, products, documents and other registered resources.
- Resource-scoped search with filters, sorting, pagination and highlighting.
- Search-as-you-type/autocomplete.
- Suggestions and did-you-mean correction.
- Exact identifier/SKU/code search.
- Facets and filter counts.
- Permission- and tenant-aware result filtering.

## Index ownership

Search owns `search-*` indexes only. Reporting owns `facts-*`, `dimensions-*` and `aggregates-*`. Business services never write directly to these indexes.

## Documents

This directory contains the canonical 21-document service contract.
