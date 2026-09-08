# Location Service — API

Base path: `/v1`.

## HTTP endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/location/geocode` | address/query → candidates |
| POST | `/location/reverse-geocode` | coordinate → address |
| GET | `/places/search` | provider-backed place search |
| GET | `/places/:id` | normalized place |
| POST | `/routes` | route between points |
| POST | `/routes/matrix` | distance/time matrix |
| POST | `/geofences` | create geofence |
| GET | `/geofences` | list tenant geofences |
| GET | `/geofences/:id` | get geofence |
| PATCH | `/geofences/:id` | update geofence |
| DELETE | `/geofences/:id` | soft/delete geofence |
| POST | `/geofences/check` | point membership check |
| GET | `/locations/current` | current positions |
| POST | `/tracking/ingest` | batch GPS telemetry |
| GET | `/visits` | visit history |

## Common request metadata

Authenticated requests carry `tenantId`, `actorId`, `subjectId`, scopes and service identity from the platform gateway. Clients cannot override authorization context.

## Coordinate contract

- WGS84 longitude/latitude.
- GeoJSON is used for polygon/multipolygon boundaries.
- API accepts decimal degrees.
- Accuracy is meters where supplied.
- Timestamps are RFC 3339 UTC.

## Error envelope

```json
{
  "error": {
    "code": "LOCATION_PROVIDER_UNAVAILABLE",
    "message": "No healthy provider is available",
    "requestId": "...",
    "retryable": true
  }
}
```

Stable error codes are part of the contract. Provider-native status codes must not leak through the public API.

## Idempotency

Mutating requests that can be retried accept `Idempotency-Key`. Tracking points are deduplicated by `(deviceId, eventId)` or `(deviceId, sequence)`.

## Pagination

List APIs use opaque cursors. Provider result pagination is never exposed as a vendor cursor.
