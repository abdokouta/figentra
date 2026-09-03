/**
 * @file index.ts
 * @module @stackra/zones/native
 * @description Public API for `@stackra/zones/native`.
 *
 *   RN-side bindings — mirrors the web subpath's public shape 1:1.
 *   Contexts, hooks, and providers are cross-platform and live
 *   under `@stackra/zones/core`; this subpath re-exports them so
 *   consumer RN code writes identical imports to the web side.
 *   Only the RN-specific components + `renderContribution` util
 *   live directly here.
 *
 *   The native subpath does NOT ship its own DI module — the zones
 *   runtime has no RN-specific bindings beyond the components +
 *   util it exports. Consumer apps import `ZonesModule.forRoot()`
 *   from the core subpath.
 */

// ════════════════════════════════════════════════════════════════════
// Cross-platform React entities — reach through to core.
// ════════════════════════════════════════════════════════════════════
export {
  ZoneContextSourceContext,
  ZoneContextSourceProvider,
  useZone,
  useZoneContext,
  type IZoneContextSource,
  type IZoneContextSourceProviderProps,
  type IUseZoneResult,
} from "../core";

// ════════════════════════════════════════════════════════════════════
// Components — RN-specific, live in this subpath.
// ════════════════════════════════════════════════════════════════════
export {
  Zone,
  FormFieldZone,
  TableColumnZone,
  type IZoneProps,
  type IFormFieldZoneProps,
  type ITableColumnZoneProps,
} from "./components";

// ════════════════════════════════════════════════════════════════════
// Utils (renderContribution — RN-specific; imports @stackra/sdui/native
// dynamically for the "sdui" arm).
// ════════════════════════════════════════════════════════════════════
export { renderContribution } from "./utils";
