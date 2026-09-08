# Location Service — Architecture

## Boundary

The Location Service is an independently deployable NestJS service. It owns location-domain behavior and PostGIS persistence. It is not a map-tile proxy and not the platform-wide sync service.

```text
Clients
  ├─ map SDK/provider ───────────────> map tiles/rendering
  └─ Location API ──HTTP─────────────> Location Service
                                      ├─ domain/application
                                      ├─ provider adapters
                                      ├─ Postgres + PostGIS
                                      ├─ NATS
                                      └─ telemetry workers
```

## Runtime roles

- API: synchronous geocoding, places, routes, geofences and current-location reads.
- Consumer: NATS event handlers and platform commands.
- Worker: tracking normalization, geofence transitions and provider retries.
- All roles use the same domain/application contracts; deployment may scale roles independently later.

## Hard boundaries

- Other services consume contracts, never Location ORM entities.
- Identity/authorization comes from platform IAM; Location enforces the resulting scope.
- Notification delivery is owned by Notifications. Location emits events only.
- General offline business synchronization is owned by the platform sync service. Tracking has its own telemetry ingestion protocol.

## Request flow

1. Gateway authenticates the request and establishes service/user/tenant context.
2. Location validates authorization and request schema.
3. Application service selects provider or queries PostGIS.
4. Domain result is normalized to Figentra contracts.
5. Provider failures are translated to stable error codes.
6. Mutations commit data and outbox/event records atomically.

## Provider selection

Selection considers requested capability, configured region, provider health, quota, cost policy and explicit caller preference. Fallback is allowed only where result semantics are equivalent.

## Data

PostGIS is authoritative for reusable locations, regions, geofences and current state. High-volume tracking history is append-oriented and partitioned/retained separately from transactional tables.
