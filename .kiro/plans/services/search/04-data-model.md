# Search — Data Model

Search stores only projections. Each document contains `tenant_id`, `resource_type`, `resource_id`, `version`, `title`, `subtitle`, exact identifiers, searchable text, normalized text, filters/facets, sort fields, result metadata and timestamps.

Initial indexes include `search-customers-v1`, `search-orders-v1`, `search-products-v1`, `search-projects-v1`, `search-tasks-v1`, `search-documents-v1`; resource registration is extensible.

Use aliases (`search-customers`) over versioned indexes. Each index has explicit mappings and analyzers. Exact IDs/SKUs use keyword/numeric fields and do not receive fuzzy matching by default. Text fields use `search_as_you_type` or explicit completion fields for autocomplete where appropriate.