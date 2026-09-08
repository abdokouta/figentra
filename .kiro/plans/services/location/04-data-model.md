# Location Service — Data Model

## Core tables

- `locations`: canonical reusable location/place reference, tenant scoped where applicable.
- `addresses`: normalized postal/address representations.
- `geofences`: circle/polygon/multipolygon geometry plus policy metadata.
- `regions`: reusable business regions and geometry.
- `current_locations`: latest known position per tracked subject/device.
- `tracking_points`: append-only telemetry, partitioned by time when volume requires it.
- `visits`: derived stay/visit intervals.
- `location_provider_cache`: provider response cache with explicit expiry.
- `outbox_events`: transactional event publication queue.

## Spatial types

Use PostGIS `geography(Point,4326)` for distance semantics and `geometry(...,4326)` for GeoJSON polygons where appropriate. All geometry columns have spatial indexes.

## Important indexes

- GiST on `geofences.geometry`.
- GiST on `regions.geometry`.
- GiST on `locations.point`.
- B-tree on `(tenant_id, subject_id)` for current positions.
- B-tree on `(device_id, event_id)` for telemetry idempotency.
- Time/tenant indexes on tracking partitions.

## Spatial operations

Use indexed predicates such as `ST_DWithin` for radius checks. Avoid loading all tenant geometries into application memory.

## Tracking history

Tracking points are immutable after acceptance. Device timestamps and server ingestion timestamps are both retained. Late points are accepted within a configured window and marked as late when appropriate.

## Current position

`current_locations` is mutable state optimized for reads. It is not the audit history. Every accepted telemetry point may update it according to monotonicity/accuracy policy.

## Deletion

Business location records support soft deletion where referenced. Telemetry retention is policy-driven and may be hard-deleted after retention. Provider caches are disposable.
