/**
 * @file use-inject.hook.ts
 * @module @stackra/container/react/hooks/use-inject
 * @description `useInject()` — resolve a provider from the DI container
 *   the enclosing `<ContainerProvider>` supplies.
 *
 *   The hook routes through `useContainer()` so any consumer that
 *   mounts a SCOPED context via `<ContainerProvider context={scoped}>`
 *   (tests, sub-trees, multi-tenant sandboxes) sees the scoped
 *   container's bindings, not the process-global application. When
 *   no explicit `context` prop is passed, `ContainerProvider` falls
 *   back to the global application, so bare `useInject()` in a
 *   normally-mounted app resolves against the global — matching the
 *   pre-fix behavior for that common case.
 *
 *   Historical note: the pre-fix implementation routed through
 *   `inject()` from `@/core/utils/inject.util`, which was hard-coded
 *   to read `getGlobalApplicationContext()`. That silently ignored
 *   `<ContainerProvider context={...}>` — a type-shape mismatch
 *   flagged in the frontend-final-production-review remediation
 *   (§E "useInject / ContainerProvider mismatch"). Route through
 *   `useContainer()` so the two React APIs agree on which container
 *   they mean.
 */

import { useMemo } from "react";

import type { Abstract, InjectionToken, Type } from "@stackra/contracts";
import { useContainer } from "@/core/hooks/use-container";

/**
 * Resolve a provider from the DI container the enclosing
 * `<ContainerProvider>` supplies.
 *
 * The resolved instance is memoised — it stays reference-stable
 * across re-renders unless the container or token changes.
 *
 * Under `<ContainerProvider context={scoped}>`, `useInject` sees
 * the scoped container. Under bare `<ContainerProvider>` (no
 * `context` prop), it sees the global application.
 *
 * @typeParam T - The type of the resolved provider.
 * @param token - The injection token (class, string, or symbol).
 * @returns The resolved provider instance.
 *
 * @throws Error when used outside `<ContainerProvider>` — the
 *   error message points at the wrap-with-provider fix per
 *   `useContainer()`'s own contract.
 * @throws Error when the container has no binding for `token`. The
 *   `ApplicationContext.get(token)` call surfaces the missing-token
 *   error with the token's string form so the caller can locate the
 *   missing `providers` entry.
 *
 * @example
 * ```typescript
 * // Inject by class
 * function UserProfile() {
 *   const userService = useInject(UserService);
 *   const user = userService.getUser("123");
 *   return <div>{user.name}</div>;
 * }
 *
 * // Inject by symbol token
 * function CacheStatus() {
 *   const config = useInject<CacheConfig>(CACHE_CONFIG);
 *   return <div>Default store: {config.default}</div>;
 * }
 *
 * // Scoped container (tests)
 * function TestApp() {
 *   const scoped = createTestApplication();
 *   return (
 *     <ContainerProvider context={scoped}>
 *       <UserProfile />
 *     </ContainerProvider>
 *   );
 *   // useInject(UserService) inside <UserProfile> resolves against
 *   // `scoped`, not the process-global application.
 * }
 * ```
 */
// ── Overload set ──
// Class tokens (concrete + abstract) get their instance type inferred
// from the constructor / prototype directly. This overload has to
// come FIRST so TypeScript picks it before the generic fallback
// (where `T` would collapse to `unknown` for callers that don't
// pass a generic — as happens when the type comes from source via
// workspace linkage, not from a bundler-emitted `.d.ts`).
export function useInject<T>(token: Type<T>): T;
export function useInject<T>(token: Abstract<T>): T;
// Symbol / string token fallback — caller must provide the generic
// so we know what shape the token binds.
export function useInject<T = unknown>(token: InjectionToken<T>): T;
export function useInject<T = unknown>(token: InjectionToken<T>): T {
  const container = useContainer();
  return useMemo(() => container.get<T>(token), [container, token]);
}
