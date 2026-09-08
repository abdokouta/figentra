# Location Service — Events

Events are published through the platform NATS boundary after durable local commit.

## Subjects

```text
location.location.created
location.location.updated
location.geofence.created
location.geofence.updated
location.geofence.entered
location.geofence.exited
location.tracking.accepted
location.visit.started
location.visit.ended
location.region.entered
location.region.exited
```

## Envelope

```json
{
  "eventId": "01...",
  "eventType": "location.geofence.entered",
  "schemaVersion": 1,
  "occurredAt": "2026-09-08T12:00:00Z",
  "tenantId": "...",
  "actorId": "...",
  "source": "location-service",
  "data": {}
}
```

Consumers must be idempotent. Location uses an outbox to prevent a database commit from succeeding while event publication is lost.

Telemetry events are intentionally not emitted for every raw point unless an explicit downstream contract requires it; high-frequency points stay within telemetry storage/processing.
