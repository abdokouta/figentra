/**
 * @file index.ts
 * @module @stackra/zones/core/contexts
 * @description Public barrel for the contexts owned by
 *   `@stackra/zones/core`. Contexts live in `core/` (not
 *   `react/` / `native/`) per
 *   `.kiro/steering/ui-components.md` §"Where does a hook go?" —
 *   the `core/` escape hatch applies to every pure-React entity
 *   (hooks, contexts, providers) so `react/index.ts` and
 *   `native/index.ts` re-export them without duplication.
 */

export {
  ZoneContextSourceContext,
  type IZoneContextSource,
} from "./zone-context-source.context";
