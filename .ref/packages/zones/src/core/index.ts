/**
 * @file index.ts
 * @module @stackra/zones
 * @description Public API for `@stackra/zones` (core subpath).
 *
 *   Cross-package contract types (`IZoneContribution`, `IZoneContext`,
 *   `IZoneRegistry`, `IFieldDescriptor`, `IColumnDescriptor`,
 *   `ZonePosition`) live in `@stackra/contracts` — consumers import
 *   them directly per
 *   `.kiro/steering/contract-reexports.md`. This barrel exports only
 *   package-owned symbols.
 */

import "reflect-metadata";

// ════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════
export { ZonesModule } from "./zones.module";

// ════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════
export { ZoneRegistry } from "./services";

// ════════════════════════════════════════════════════════════════════
// Utils — pure algorithms shared by react / native subpaths
// ════════════════════════════════════════════════════════════════════
export {
  resolveZoneOrder,
  flattenIntrinsicChildren,
  defineZone,
  __resetZoneOrderWarnings,
  __resetFlattenWarnings,
  type IZoneContributionInput,
  type IZoneReactContributionInput,
} from "./utils";

// ════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════
export { DEFAULT_ORDER } from "./constants";

// ════════════════════════════════════════════════════════════════════
// Cross-platform React entities (contexts + hooks + providers).
// Live in `core/` per `ui-components.md` §"Where does a hook go?" —
// the `core/` escape hatch applies to any pure-React entity (uses
// only `useContext` / `useMemo` / `useInject`; no DOM, no
// react-native imports). Both `react/index.ts` and `native/index.ts`
// re-export from this barrel so consumers write identical imports
// on either surface.
// ════════════════════════════════════════════════════════════════════
export { ZoneContextSourceContext, type IZoneContextSource } from "./contexts";
export {
  ZoneContextSourceProvider,
  type IZoneContextSourceProviderProps,
} from "./providers";
export { useZone, useZoneContext, type IUseZoneResult } from "./hooks";

// ════════════════════════════════════════════════════════════════════
// Package-owned algorithm types
// ════════════════════════════════════════════════════════════════════
export type {
  IntrinsicChild,
  OrderedItem,
  IZonesModuleOptions,
} from "./interfaces";
