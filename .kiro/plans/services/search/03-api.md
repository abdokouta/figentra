# Search — API

Public routes: `POST /v1/search`, `POST /v1/search/autocomplete`, `POST /v1/search/suggest`, `GET /v1/search/resources`, `POST /v1/search/indexes/:resource/rebuild`.

Request fields include `query`, `resourceTypes`, `filters`, `sort`, `page`, `pageSize`, `highlight`, `facets`, `locale`, and `context`. The API accepts resource-level filters but never accepts raw provider DSL. The service derives tenant and authorization scope from trusted RequestContext.

Autocomplete is optimized for keystroke latency and returns typed suggestions with resource metadata. Global search returns grouped/weighted results across registered resources.