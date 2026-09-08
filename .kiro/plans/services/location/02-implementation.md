# Location Service — Implementation

## Source tree

```text
services/location/
  src/
    main.ts
    app.module.ts
    common/                 # errors, request context, validation
    modules/
      geocoding/
      places/
      routing/
      geofencing/
      tracking/
      visits/
      regions/
      location/
      providers/
    infrastructure/
      database/
      messaging/
      cache/
      telemetry/
      health/
    workers/
  test/
  cloud.yaml
  package.json
  tsconfig.json
```

## Module rules

Each module has controller/transport, application service, domain types and infrastructure adapters where required. Controllers never call provider SDKs directly.

## Framework

- Node 24.
- NestJS 12.
- Fastify HTTP adapter.
- `@nestjs/microservices` for NATS transport.
- MikroORM/PostgreSQL for persistence.
- Zod or equivalent runtime validation at contract boundaries.

## Initial implementation order

1. Service bootstrap, health, config and error envelope.
2. PostGIS connection/migrations and tenant-scoped repositories.
3. Provider contract + one provider adapter.
4. Geocoding and place search.
5. Routing and matrix.
6. Geofences.
7. Current-location and tracking ingestion.
8. Visits and derived events.
9. Caching, quotas, observability and resilience hardening.

## Contract rule

Domain code may depend on `LocationProvider` capabilities, never on Mapbox/HERE/Amazon/Google SDK types. Provider SDK types terminate inside the adapter.
