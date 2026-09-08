# Location Service — Runtime Manifest

## Identity

- Service: `location-service`
- Workspace: `services/location`
- HTTP port: `3010`
- Base path: `/v1`
- Internal transport: NATS
- Primary database: PostgreSQL + PostGIS

## Health

- `/v1/health/live`: process liveness.
- `/v1/health/ready`: dependency-aware readiness.

## Required capabilities

- PostgreSQL/PostGIS
- NATS JetStream
- secret injection
- observability
- provider credentials

## Runtime contract

The service must start with configuration validation, expose health endpoints, emit structured logs and terminate gracefully. The deployment platform must not infer business behavior from the manifest; business contracts remain in source and service docs.
