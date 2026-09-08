# Search — Security and Authorization

All queries are tenant-scoped from trusted RequestContext. Resource permissions are evaluated before query execution and may be compiled into mandatory filters. User-supplied tenant/org IDs are never authoritative. Search documents exclude fields that callers are not permitted to discover. Audit sensitive/global searches and administrative index operations.