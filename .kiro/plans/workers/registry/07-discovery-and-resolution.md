# Registry — Discovery and Resolution

## Resolution dimensions

Resolve by application identifier, environment, version/revision, hostname, route, service, capability or metadata key. Resolution is deterministic and based only on validated Registry records.

## Algorithms

Hostname → application/environment mapping → active deployment/version → route trie/exact matcher → service target metadata → transport binding. Capability lookup → application/environment → capability key → compatible version. Service lookup → application/version/environment → service ID.

## Security

Protected metadata requires authenticated context and tenant/application authorization. Public metadata is explicitly classified. No browser-provided tenant or application identifier can widen access.

## Caching

Immutable revision/hash responses use long-lived versioned KV keys. Active aliases have bounded TTL and explicit invalidation. Cache misses query D1. Corrupt/invalid cache entries are discarded. KV can be deleted and rebuilt entirely from D1.

## Failure

Unknown route returns stable 404. Missing application/environment/version returns stable resolution error. D1 outage uses only explicitly safe cached immutable metadata; no stale mutable route may be invented. Gateway fails closed when protected resolution cannot be trusted.

## Testing

Test exact host/path matches, collisions, version selection, disabled applications, tenant isolation, cache hit/miss/invalidation, stale entries, D1 failure, concurrent publication and rollback to a previous immutable revision.