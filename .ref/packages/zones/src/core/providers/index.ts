/**
 * @file index.ts
 * @module @stackra/zones/core/providers
 * @description Public barrel for cross-platform React providers
 *   owned by `@stackra/zones/core`.
 *
 *   Providers live in `core/providers/` when they render only
 *   `<Context.Provider>` wrappers (no platform-specific JSX). Both
 *   `react/index.ts` and `native/index.ts` re-export from here per
 *   `.kiro/steering/ui-components.md` §"Where does a hook go?" —
 *   the `core/` escape hatch applies to providers on the same
 *   terms as hooks + contexts.
 */

export {
  ZoneContextSourceProvider,
  type IZoneContextSourceProviderProps,
} from "./zone-context-source";
