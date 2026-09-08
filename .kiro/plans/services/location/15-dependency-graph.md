# Location Service — Dependency Graph

## Allowed dependencies

```text
location-service
  -> platform config/auth/contracts
  -> PostgreSQL/PostGIS
  -> NATS
  -> provider adapters
  -> observability
```

## Forbidden dependencies

- Importing another service's entities/repositories.
- Direct writes into another service database.
- Calling notification/email/SMS providers directly.
- Making clients depend on provider SDK types.
- Treating map rendering as a server responsibility.

## Package direction

`transport -> application -> domain <- infrastructure`.

Provider adapters implement domain/application ports. Infrastructure details never flow into domain contracts.
