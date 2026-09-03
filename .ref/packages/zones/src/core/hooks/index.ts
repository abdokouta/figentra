/**
 * @file index.ts
 * @module @stackra/zones/core/hooks
 * @description Public barrel for cross-platform React hooks owned
 *   by `@stackra/zones/core`.
 *
 *   Hooks live in `core/hooks/` (not `react/hooks/` +
 *   `native/hooks/`) per
 *   `.kiro/steering/ui-components.md` §"Where does a hook go?" —
 *   both `react/index.ts` and `native/index.ts` re-export from
 *   here. The hooks depend only on pure React primitives
 *   (`useContext`, `useMemo`, `useInject`) and are safe on both
 *   DOM + RN runtimes.
 */

export { useZone, type IUseZoneResult } from "./use-zone";
export { useZoneContext } from "./use-zone-context";
