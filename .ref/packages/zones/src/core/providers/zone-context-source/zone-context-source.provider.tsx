/**
 * @file zone-context-source.provider.tsx
 * @module @stackra/zones/core/providers
 * @description `<ZoneContextSourceProvider>` — publishes the
 *   permissions / features / tenant signals every `<Zone>` renders
 *   with to the tree below.
 *
 *   Wire from ONE place in the consumer app (typically inside the
 *   auth or tenancy provider) — every `<Zone>` under the subtree
 *   picks up the signals automatically. Skipping the provider is
 *   fine; `<Zone>` degrades to empty permissions / features and
 *   `undefined` tenant.
 */

import { useMemo, type ReactElement, type ReactNode } from "react";

import {
  ZoneContextSourceContext,
  type IZoneContextSource,
} from "../../contexts/zone-context-source.context";

/**
 * Props for {@link ZoneContextSourceProvider}.
 */
export interface IZoneContextSourceProviderProps {
  /**
   * The permissions the current user holds. Empty array when the
   * user has none / when RBAC isn't wired yet.
   */
  readonly permissions?: readonly string[];

  /**
   * The features entitled to the current tenant. Empty array when
   * feature-flags aren't wired.
   */
  readonly features?: readonly string[];

  /**
   * The current tenant record. `undefined` on central / marketing
   * surfaces that have no tenant.
   */
  readonly tenant?: Readonly<Record<string, unknown>>;

  /**
   * The subtree the provider renders around — every `<Zone>` under
   * it reads the provided source.
   */
  readonly children: ReactNode;
}

/**
 * Publishes an `IZoneContextSource` to the tree below.
 *
 * Every field is memoised into a single value object so the React
 * context only re-broadcasts when a leaf changes. Consumers who
 * pass a fresh array on every render (`permissions={[...perms]}`)
 * still get correct semantics — the memo dep list is deep-shallow
 * on the arrays' identity, so a stable array reference from the
 * caller means one context value across renders.
 *
 * @example
 * ```tsx
 * function AppShell({ user }: { user: SessionUser }) {
 *   return (
 *     <ZoneContextSourceProvider
 *       permissions={user.permissions}
 *       features={user.tenant.features}
 *       tenant={user.tenant}
 *     >
 *       <Outlet />
 *     </ZoneContextSourceProvider>
 *   );
 * }
 * ```
 */
export function ZoneContextSourceProvider({
  permissions,
  features,
  tenant,
  children,
}: IZoneContextSourceProviderProps): ReactElement {
  // Memoise the source object so the context value's identity is
  // stable across renders when the underlying arrays / tenant
  // reference haven't changed. Consumers with stable-reference
  // signal sources (Zustand / TanStack Store / Redux) benefit
  // immediately; consumers producing fresh arrays every render
  // pay a shallow-array cost per zone resolve, which the
  // `resolveZoneOrder` pure function can absorb.
  const value = useMemo<IZoneContextSource>(
    () => ({
      // Only include fields the caller supplied; every reader
      // treats absent fields as "empty".
      ...(permissions !== undefined ? { permissions } : {}),
      ...(features !== undefined ? { features } : {}),
      ...(tenant !== undefined ? { tenant } : {}),
    }),
    [permissions, features, tenant],
  );

  return (
    <ZoneContextSourceContext.Provider value={value}>
      {children}
    </ZoneContextSourceContext.Provider>
  );
}

ZoneContextSourceProvider.displayName = "ZoneContextSourceProvider";
