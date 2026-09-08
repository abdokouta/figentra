# Location Service — Data Lifecycle

## Retention classes

| Data | Default policy |
|---|---|
| Current location | while tracking subject is active + configured grace |
| Raw tracking points | short, tenant-configurable retention |
| Visits | business retention policy |
| Geofences/regions | until deleted/expired |
| Provider cache | short TTL, disposable |
| Audit access records | platform audit policy |

Exact production durations are configuration/tenant-policy decisions, not hard-coded in domain logic.

## Deletion

Deletion is authorization-controlled and auditable. Derived state is removed/recomputed according to dependency rules. Telemetry partitions are preferred for efficient retention cleanup.

## Residency

Provider selection and database deployment may be region-aware. The service must not silently route location data to a provider/region prohibited by tenant policy.
