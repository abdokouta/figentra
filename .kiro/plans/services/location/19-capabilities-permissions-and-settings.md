# Location Service — Capabilities, Permissions and Settings

## Capabilities

```text
location.read
location.search
location.route
location.geofence.read
location.geofence.write
location.tracking.read
location.tracking.ingest
location.visit.read
location.admin
```

Capabilities are platform permission identifiers; the service checks them against the authenticated context.

## Tenant settings

Tenant configuration may control provider policy, default route profile, telemetry retention, geofence evaluation, allowed regions and cost limits. Security-sensitive settings require elevated permission.

## Subject visibility

Current location and history may have narrower visibility than general tenant location data. The service must support subject/device-level scopes without exposing unrestricted location data through bulk endpoints.

## Audit

Administrative reads, exports, policy changes and destructive actions are audit-worthy. Raw telemetry should not be copied into audit logs.
