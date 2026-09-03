/**
 * @file index.ts
 * @module @stackra/zones/react
 * @description Public API for `@stackra/zones/react`.
 *
 *   Web-side bindings for the zone/slot runtime. Contexts, hooks,
 *   and providers are cross-platform — they live under
 *   `@stackra/zones/core` and re-export here so consumers can
 *   import them via the react-subpath entry. DOM-specific
 *   components + the `renderContribution` util + the
 *   `WebZonesModule` binding are web-owned.
 *
 *   Cross-package contract types (`IZoneContribution`,
 *   `IZoneContext`, `IZoneRegistry`, `IFieldDescriptor`,
 *   `IColumnDescriptor`, `ZonePosition`) live in `@stackra/contracts`
 *   and are imported from there per `contract-reexports.md`.
 */

// ── Cross-platform React entities — reach through to core.
export {
  ZoneContextSourceContext,
  ZoneContextSourceProvider,
  useZone,
  useZoneContext,
  type IZoneContextSource,
  type IZoneContextSourceProviderProps,
  type IUseZoneResult,
} from "../core";

// ── Components — DOM-specific, live in this subpath.
export {
  Zone,
  FormFieldZone,
  TableColumnZone,
  type IZoneProps,
  type IFormFieldZoneProps,
  type ITableColumnZoneProps,
} from "./components";

// ── Utils — DOM-specific dynamic import of the SDUI react subpath.
export { renderContribution } from "./utils";

// ── DI wiring
export { WebZonesModule } from "./web-zones.module";

// ── Interfaces
export type { IWebZonesModuleOptions } from "./interfaces";
