---
status: canonical
component: package
package: "@stackra/identity"
runtime: node,browser,react,react-native,desktop
---
# `@stackra/identity` — enterprise implementation plan

## Purpose
Reusable identity/authentication SDK boundary. It owns authentication orchestration, provider adapters, token verification, sessions, credential references, service identities, identity links, principal normalization, actor/tenant identity context and impersonation/delegation context. It does not own authorization policy.

## Non-goals
IAM roles/permissions/policy decisions, tenant business data, provider-owned user databases, domain user models and audit persistence.

## Layout
`src/contracts`, `src/core`, `src/providers`, `src/session`, `src/context`, `src/security`, `src/discovery`, `src/index.ts`.

## Public API
`IdentityManager`, `AuthenticationService`, `TokenVerifier`, `SessionManager`, `PrincipalResolver`, `IdentityContext`, `ActorContext`, `ServiceIdentity`, provider adapter tokens, normalized principal/session contracts and typed authentication errors. Cross-service protocol contracts remain in `@stackra/contracts`.

## Provider
Day-one human provider: Supabase Auth. Provider SDK types are adapter-local. Service-to-service identity uses explicit service credentials/verification and never reuses browser sessions.

## DI/lifecycle
Singleton immutable provider registry; request-scoped identity/context objects; transient verification operations. No global mutable current-user/tenant state.

## Security
JWT signature/issuer/audience/expiry validation, clock-skew policy, refresh/session rotation, credential minimization, secure storage by runtime, explicit impersonation/delegation claims and mandatory actor/principal separation.

## Errors/recovery
Typed authentication/verification/provider errors; fail closed on invalid credentials; bounded provider retries only where safe; cancellation and timeout propagation.

## Observability
Authentication outcomes and latency via `@stackra/logger`/`@stackra/observability`; never emit tokens, raw claims, secrets or sensitive identity payloads.

## Testing
Provider conformance, token verification, expiry/skew, session rotation, tenant/actor context, impersonation, service identity, browser/native/desktop secure-storage behavior and failure-mode tests.

## Compatibility / exports
Strict semver public exports, explicit runtime entry points, no standalone `@stackra/auth` package and no compatibility shim as a target architecture.

## Exit criteria
Real Supabase adapter, complete identity contexts, secure runtime storage integration, tests and documented conformance are implemented without deferred auth architecture.
