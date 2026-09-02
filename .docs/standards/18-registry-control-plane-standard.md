# Registry Control-Plane Standard

## Canonical inventory

Applications register immutable version manifests. First-class categories are applications, versions, environments, capabilities, modules, resources, actions, routes, navigation, registrations, audit, events, workflows, integrations, settings, features, widgets, and localization. The seven extensible metadata categories use the constrained versioned `application_catalog_items` table and `/v1/catalog/:category` APIs; they are not ad-hoc JSON or undocumented tables.

## NestJS producer contract

- `RegistryModule.forRoot()` configures application identity and Registry transport.
- `RegistryModule.forFeature()` contributes module/resource/action/navigation plus all day-one catalog categories.
- Nest `DiscoveryService` automatically discovers registry decorators and `@figentra/workflows` workflow metadata.
- Services never write Registry D1 directly.
- Registration is versioned and content-hashed.
- Registration failures are configurable fail-soft/fail-fast.

## Boundary rule

The Registry Worker remains Hono/Cloudflare-native. The NestJS module is a producer SDK/integration layer, not a reason to move the Registry Worker to NestJS.
