# 10 — Application Registry

**Status: FOUNDATION**

**Runtime: Cloudflare Worker + Hono · Store: D1 (with KV/cache where justified)**

## Purpose

Registry stores application metadata and capabilities.

The registry is a lightweight control-plane registry and is a Worker, not a NestJS service.

Potential manifest:

```text
Application
Module
Resource
Action
Permission
ScopeType
Policy
Workflow
Event
Webhook
Integration
Feature
API
Version
Navigation
Theme
Branding
```

## Runtime and placement

The registry is high-read/low-compute metadata. Keep it in `workers/registry` using the official Cloudflare/Hono scaffold. Use D1 for authoritative registry records and KV/edge caching only for read optimization.

It does not perform full IAM authorization; it can validate basic access at the edge and delegate authorization to IAM when needed.

## Registry is not SDUI

Registry does NOT define arbitrary UI trees.

Applications own explicit React UI.

## Decorator/scanner direction

Potential decorators:

```text
@Application()
@Module()
@Resource()
@Action()
@Permission()
@Event()
@Workflow()
```

Scanner:

```text
source
 ↓
metadata scanner
 ↓
manifest
 ↓
registry
```

Registration must be idempotent and version-aware.

## Registry vs business database

Registry:

> Commerce has a Warehouse resource.

Commerce service:

> Warehouse 123 exists with business fields.

Registry never becomes the application's business database.

## Dynamic application registration

Applications may publish:

- identity
- capabilities
- resources
- actions
- permissions
- routes/route metadata
- feature flags
- integrations
- versions
- branding/theme

The UI remains application-owned.


## Producer-side NestJS integration

`@figentra/registry` provides the preferred declarative producer pattern:
`RegistryModule.forRoot()` establishes application identity/transport and
`RegistryModule.forFeature()` adds explicit inventory. For larger applications,
Nest `DiscoveryService` can collect metadata from decorators attached to providers
and controllers, allowing teams to keep the manifest close to the owning class.

The collector is compile/registration tooling only. It never writes D1 directly;
it produces the same canonical manifest submitted to the Registry Worker.
