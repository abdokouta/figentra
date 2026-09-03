---
authored_by: kiro
authored_at: 2026-09-03
status: normative
---
# Tenancy, Scope, Identity and Session Contract

## Ownership
```text
Identity service/package → authentication, principal, sessions, identity links
Tenant service          → tenants, organizations, memberships, domains, bindings
IAM                     → authorization and policy evaluation
@stackra/scope          → active client context and switcher UX
@stackra/identity/session → reusable session client integration
```

There is no separate frontend `tenant` database/package that becomes source of truth. A frontend tenant model is a read contract from Tenant service. Scope is a client state capability.

## Frontend flow
```text
IdentityProvider
 → principal/session
 → GET available tenant/workspace contexts
 → IAM-filtered membership/context list
 → ScopeProvider
 → useScope()
 → TenantSwitcher / OrganizationSwitcher
 → RequestContext headers/path/query keys
 → backend reauthorization
```

Switching scope must clear or invalidate all tenant-scoped query/cache state and cancel incompatible in-flight requests before exposing the new scope as active.

## Backend flow
```text
Gateway/authentication
 → Identity principal
 → resolve tenant context
 → IAM authorize principal + resource context
 → domain service
```
A client-provided `tenantId` is never sufficient authority. Backends resolve status/membership and re-evaluate authorization.

## Required `@stackra/scope` exports
`ScopeProvider`, `useScope`, `useRequiredScope`, `useAvailableScopes`, `ScopeSwitcher`, `TenantSwitcher`, `OrganizationSwitcher`, `ScopeStore`, `ScopeResolver`, `ScopeRouteGuard`, `scopeQueryKey`, `withScopeContext`.

## Persistence
Last-selected scope may be persisted as a non-sensitive preference. Credentials, membership claims and permission decisions cannot be persisted by Scope. Server session/refresh persistence remains Identity-owned.

## Routing
Scope may be represented in path, subdomain or application route according to host policy. The package parses/builds the representation but does not create a global URL convention.

## Mobile
React Native uses the same contracts with secure/non-sensitive storage and native navigation; it must not rely on browser cookies or DOM.

## Testing
Unauthorized scope selection, tenant switch, cache invalidation, stale-request cancellation, deep-link restoration, persistence hydration, mobile navigation and backend reauthorization are mandatory E2E scenarios.
