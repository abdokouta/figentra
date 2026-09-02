/**
 * @file index.ts
 * @module @stackra/container/react
 * @description Web (React DOM) subpath — a thin re-export of the
 *   cross-platform React bindings from `@stackra/container/core`.
 *
 *   The DI React bindings (`useInject`, `useContainer`,
 *   `useOptionalInject`, `useDiscovery`, `useDiscovered`,
 *   `ContainerContext`, `ContainerProvider`) are pure React —
 *   zero DOM imports, zero RN imports. Per
 *   `.kiro/steering/subpath-layering.md` §"Where does a hook /
 *   context / provider go?", cross-platform entities live under
 *   `core/` and both `react/` + `native/` re-export from there.
 *
 *   Consumers may equivalently import from `@stackra/container`
 *   (root) — the root export was added to make cross-platform
 *   `core/` hooks in downstream packages import-clean without
 *   pulling `/react`. This subpath stays for backwards compat.
 */
export {
  ContainerContext,
  ContainerProvider,
  useContainer,
  useInject,
  useOptionalInject,
  useDiscovery,
  useDiscovered,
} from "../core";
