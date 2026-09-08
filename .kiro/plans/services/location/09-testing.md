# Location Service — Testing

## Unit

Test domain policies without NestJS/provider SDKs: coordinate validation, route request normalization, geofence transitions, telemetry ordering, deduplication, visit state and provider selection.

## Integration

Run against PostgreSQL/PostGIS and NATS test infrastructure. Verify migrations, spatial indexes/queries, outbox atomicity and consumer idempotency.

## Contract

Provider adapters pass a shared provider-contract suite. Public HTTP responses are snapshot/contract tested. NATS event schemas are versioned and compatibility tested.

## End-to-end

Cover authenticated tenant isolation, geocode fallback, route fallback, create/check geofence, offline telemetry batch replay and visit derivation.

## Failure tests

Simulate provider timeout/rate-limit, database unavailable, NATS unavailable, duplicate batches, out-of-order points, malformed geometry and stale device clocks.

## Performance

Load-test route/geocode request concurrency separately from high-frequency tracking ingestion. Spatial queries must demonstrate index usage on representative tenant data.
