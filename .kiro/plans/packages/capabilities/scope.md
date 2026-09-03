---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/scope'
---
# `@stackra/scope` — Tenant / Workspace Context & Switcher

## Decision
`@stackra/scope` is a reusable client capability for selecting and carrying the active tenant/workspace/resource context. It does not own tenant business data or replace the Tenant service. Identity authenticates the principal; Tenant owns tenant membership and hierarchy; IAM decides access; Scope manages the active client context and switcher UX.

No standalone `@stackra/tenant` frontend package is required. Tenant API contracts are imported from `@stackra/contracts`; authenticated identity/session information comes from `@stackra/identity`.

## Subpaths
```text
@stackra/scope
@stackra/scope/react
@stackra/scope/react-native
@stackra/scope/http
@stackra/scope/nestjs
@stackra/scope/testing
```

## Public contracts
```ts
interface ScopeRef { tenantId: string; organizationId?: string; applicationId?: string; resourceType?: string; resourceId?: string; }
interface ScopeStore { get(): ScopeRef | null; set(scope: ScopeRef): Promise<void>; clear(): Promise<void>; subscribe(listener: (scope: ScopeRef | null) => void): () => void; }
interface ScopeResolver { listAvailable(ctx: RequestContext): Promise<ScopeOption[]>; validate(ctx: RequestContext, scope: ScopeRef): Promise<ValidatedScope>; }
```
React exports `ScopeProvider`, `useScope`, `useRequiredScope`, `useAvailableScopes`, `ScopeSwitcher`, `TenantSwitcher`, `OrganizationSwitcher`, `useScopeRequiredQueryKey` and route guards. Native exports equivalent primitives using native storage/navigation.

## Flow
```text
Identity session
 → principal
 → Tenant service memberships/available contexts
 → IAM authorization filtering
 → ScopeStore active context
 → HTTP RequestContext / query keys / routes
 → owning service authorization
```

Client-selected tenant IDs are hints only. Backend authorization always revalidates the context.

## Persistence
Use `@stackra/storage` for last-selected scope where appropriate. Persist only opaque IDs and non-sensitive display metadata required for UX. Never persist authorization decisions or credentials. Tenant switching invalidates tenant-scoped query/cache state and cancels incompatible requests.

## Routing
The router may encode scope in path/subdomain/application context according to the host app. Scope package provides typed extraction/guards but does not decide URL policy.

## Testing
Test switcher filtering, unauthorized scope rejection, persistence/hydration, tenant-change query invalidation, race conditions during switching, stale-request cancellation and React/Native rendering.

## Non-goals
Tenant CRUD, membership ownership, authorization policy, identity/session ownership, billing entitlements, cross-tenant aggregation.
