# Location Service — Configuration and Registry

## Configuration groups

- `LOCATION_HTTP_*`: listener and timeouts.
- `LOCATION_DATABASE_*`: PostGIS connection/pool.
- `LOCATION_NATS_*`: broker connection and streams.
- `LOCATION_PROVIDER_*`: provider selection, credentials and quotas.
- `LOCATION_TRACKING_*`: batch size, clock skew, retention and accuracy policy.
- `LOCATION_OBSERVABILITY_*`: logs/traces/metrics.

Secrets are never committed. Provider keys are runtime secrets.

## Service registry

Canonical identity: `location-service`. The service advertises API and NATS capabilities through the platform service catalog. Other services resolve the logical service identity rather than hard-coded hostnames.

## Provider registry

Providers register capabilities such as `geocode`, `reverseGeocode`, `places`, `route`, `matrix`. The registry records health, region support, cost class and configured priority.
