# Location Service

## Purpose

Location is a first-class Figentra business service. It owns normalized location capabilities and location-domain data while treating external map/location vendors as replaceable infrastructure providers.

The service is a standalone NestJS runtime and an independent correctness/security boundary.

## Responsibilities

- Geocoding and reverse geocoding.
- Place search and normalized place records.
- Routing and distance matrices.
- Geofences and spatial checks.
- Current device/entity positions and tracking ingestion.
- Visits and location-derived events.
- Regions and reusable spatial areas.
- Provider selection, fallback, quota and cost-aware routing.
- Location-domain persistence using PostgreSQL/PostGIS.

## Non-responsibilities

- Map tile rendering or map UI.
- Authentication identity.
- Tenant/IAM source of truth.
- File/blob storage.
- Generic application synchronization.
- Direct delivery of notifications.

## Runtime

`services/location` is one NestJS source tree. It may expose API, consumer and worker roles from the same source tree. A mirrored worker application is forbidden unless a later ADR proves a separate deployment boundary.

## Documents

| Document | Contract |
|---|---|
| 01-architecture | service boundaries and runtime architecture |
| 02-implementation | exact modules and source layout |
| 03-api | HTTP API contract |
| 04-data-model | entities, PostGIS schema and indexes |
| 05-events | domain events |
| 06-jobs-and-scheduling | workers and schedules |
| 07-security-and-authorization | tenant, IAM and privacy rules |
| 08-observability | logs, metrics and traces |
| 09-testing | test strategy |
| 10-deployment-and-operations | deployment, health and runbooks |
| 11-messaging | NATS subjects, streams and DLQs |
| 12-notifications-and-realtime | realtime and notification boundaries |
| 13-runtime-and-framework | NestJS/runtime conventions |
| 14-configuration-and-registry | configuration and service registry |
| 15-dependency-graph | allowed dependencies |
| 16-data-lifecycle | retention and deletion |
| 17-resilience-and-failure | failure modes and recovery |
| 18-migrations-and-upgrades | migrations and compatibility |
| 19-capabilities-permissions-and-settings | capabilities and settings |
| 20-runtime-manifest | discoverable runtime surface |
| 21-definition-of-done | completion gate |

## Key architectural decisions

1. PostgreSQL + PostGIS is the authoritative location-domain store.
2. Map rendering stays in clients through the selected map SDK/provider; NestJS is not a tile proxy.
3. Provider adapters implement stable Figentra contracts. Provider-specific extensions are explicit rather than leaking vendor APIs into domain code.
4. Tracking telemetry is separated from ordinary business synchronization. Ingestion is idempotent, supports batching and out-of-order device timestamps, and has explicit retention.
5. Current position is separated from immutable tracking history.
6. Geofence checks use indexed spatial operations.
7. Location access is privacy-sensitive and always tenant/IAM/audit aware.
8. Business events are emitted through the platform messaging boundary; the service does not call notification providers directly.

## Initial provider posture

The first provider adapter should be selected by an ADR at implementation time. The abstraction must support Mapbox, HERE, Amazon Location and other providers without changing domain/application contracts.

## Dependencies

The service consumes trusted RequestContext and IAM/commercial decisions through the existing Figentra platform contracts. It must not import another service's ORM entities, repositories or implementation classes.
