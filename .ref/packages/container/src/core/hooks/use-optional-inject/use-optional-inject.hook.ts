/**
 * @file use-optional-inject.hook.ts
 * @module @stackra/container/react/hooks/use-optional-inject
 * @description `useOptionalInject()` — resolve a provider when it's
 *   bound, or return `null` when it isn't.
 *
 *   Sibling of {@link useInject} — same resolution path, same
 *   scoped-container semantics, but the missing-binding case yields
 *   `null` instead of throwing. Meant for optional-peer scenarios
 *   where a feature package can degrade gracefully when a companion
 *   package (e.g. `@stackra/storage`) isn't composed in the app.
 */

import { useMemo } from "react";

import type { Abstract, InjectionToken, Type } from "@stackra/contracts";
import { useContainer } from "@/core/hooks/use-container";

/**
 * Resolve a provider from the DI container the enclosing
 * `<ContainerProvider>` supplies, returning `null` when the token
 * isn't bound.
 *
 * Prefer {@link useInject} when the binding is required — this hook
 * exists specifically for optional peers.
 *
 * @typeParam T - The type of the resolved provider.
 * @param token - The injection token (class, string, or symbol).
 * @returns The resolved provider instance, or `null` when the
 *   container has no binding for `token`.
 *
 * @throws Error when used outside `<ContainerProvider>` — the
 *   error message points at the wrap-with-provider fix per
 *   `useContainer()`'s own contract.
 *
 * @example
 * ```typescript
 * function NavBanner() {
 *   // Storage manager is an optional peer — headless consumers
 *   // (tests, SSR) may not compose it.
 *   const storage = useOptionalInject<IStorageManager>(STORAGE_MANAGER);
 *
 *   useEffect(() => {
 *     if (!storage) return; // graceful degradation
 *     void storage.instance().get("banner-dismissed").then(...);
 *   }, [storage]);
 * }
 * ```
 */
// ── Overload set ──
// Class tokens (concrete + abstract) get their instance type inferred
// from the constructor / prototype directly. Match `useInject`'s
// overload strategy for the same source-vs-dist inference reason.
export function useOptionalInject<T>(token: Type<T>): T | null;
export function useOptionalInject<T>(token: Abstract<T>): T | null;
// Symbol / string token fallback — caller must provide the generic.
export function useOptionalInject<T = unknown>(
  token: InjectionToken<T>,
): T | null;
export function useOptionalInject<T = unknown>(
  token: InjectionToken<T>,
): T | null {
  const container = useContainer();
  return useMemo(() => {
    try {
      return container.get<T>(token);
    } catch {
      // Missing binding — degrade to `null` per the hook contract.
      return null;
    }
  }, [container, token]);
}
