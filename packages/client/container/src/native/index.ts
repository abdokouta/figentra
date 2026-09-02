/**
 * @file index.ts
 * @module @stackra/container/native
 * @description React Native subpath — a thin re-export of the
 *   cross-platform React bindings from `@stackra/container/core`.
 *
 *   Mirrors the web subpath's public shape 1:1. The DI hooks +
 *   context + provider are pure React (no DOM, no RN peer imports),
 *   so RN consumers get identical semantics to web consumers without
 *   the framework shipping a DOM-tainted `/react` transitive.
 *
 *   Per `.kiro/steering/subpath-layering.md` §"Where does a hook /
 *   context / provider go?", cross-platform entities live under
 *   `core/` and every platform subpath re-exports from there.
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
