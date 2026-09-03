---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/consent'
---
# `@stackra/consent` — Consent State and Enforcement Capability

## Boundary
Reusable privacy/consent contracts for web and mobile collection. It stores and resolves consent state and exposes enforcement decisions; it does not own legal policy text, identity, analytics or tracking data.

## Subpaths
```text
@stackra/consent
@stackra/consent/react
@stackra/consent/native
@stackra/consent/nestjs
@stackra/consent/http
@stackra/consent/testing
```

## Public model
```ts
interface ConsentState { subjectId?:string; categories: Record<ConsentCategory,ConsentDecision>; version:string; jurisdiction?:string; recordedAt:string; source:string; }
interface ConsentManager { get():Promise<ConsentState>; has(category:ConsentCategory):Promise<boolean>; request(categories:readonly ConsentCategory[]):Promise<ConsentState>; revoke(categories:readonly ConsentCategory[]):Promise<ConsentState>; }
```
Categories are explicit (`necessary`, `analytics`, `marketing`, `personalization`, provider-specific extensions). No default opt-in is inferred for non-required categories.

## Flow
```text
Consent policy → runtime decision → tracking/storage/cookie gates → Analytics/Marketing ingestion basis
```
Tracking must be able to fail closed when consent is unknown where policy requires consent.

## Backend
`/nestjs` exposes DTOs, `ConsentModule`, resolver and persistence ports. Consent records are immutable evidence with revision/version; corrections are new records. Tenant policy and jurisdiction are resolved server-side. Identity supplies subject identity when available.

## Security
Consent cannot be forged by a client using a tenant or subject ID alone. Timestamps use server time, records are integrity protected and access is IAM controlled.

## Testing
Browser/native permission gates, unknown/revoked consent, policy version changes, multi-jurisdiction resolution, deletion propagation and Analytics/Marketing integration.
