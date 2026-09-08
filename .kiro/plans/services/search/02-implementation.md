# Search — Implementation

Source layout:

```text
services/search/src/
  app.module.ts
  main.ts
  modules/search/
    application/  domain/  infrastructure/  http/
  modules/indexes/
  modules/projections/
  modules/autocomplete/
  modules/suggestions/
  modules/relevance/
  modules/permissions/
```

Application ports include `SearchProvider`, `IndexAdminPort`, `SearchProjectionPort`, `SearchRegistryPort` and `AuthorizationPort`. Infrastructure contains OpenSearch adapters and messaging consumers. Domain code never imports OpenSearch SDK types.

Search documents are generated from explicit projection definitions. Resource registration declares searchable fields, exact fields, URL/result metadata, analyzers, ranking weights, autocomplete fields and supported filters.