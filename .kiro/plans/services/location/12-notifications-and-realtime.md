# Location Service — Notifications and Realtime

Location does not own notification delivery.

## Realtime

A future realtime gateway may publish low-latency position/geofence changes to authorized clients. It is an optimization, not the durable source of truth. Clients recover missed updates through normal API/sync reads.

## Notifications

Location emits semantic events such as `location.geofence.entered`. The Notifications service decides channels, templates, recipients, retries and delivery providers.

## Presence

Ephemeral presence, typing and map-cursor state do not belong in Location persistence.
