# ADR-0028 — Application and Capability Registry

## Status
Accepted.

## Decision
The Application Registry is the deployable application control-plane registry.
It stores applications, versions, routes, modules, resources, actions,
capabilities, branding metadata and environment information.

Reusable packages own `catalog.json`. Deployable apps, services and Workers own
`cloud.yaml`. These are different contracts and are never treated as one
manifest.

Registry metadata informs application behavior and navigation, but does not
become SDUI. Application UI remains explicitly implemented.

## Consequences
The platform gains discovery and capability metadata without coupling business
UI rendering to a generic server-driven UI system.
