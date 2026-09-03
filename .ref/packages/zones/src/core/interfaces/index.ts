/**
 * @file index.ts
 * @module @stackra/zones/core/interfaces
 * @description Public barrel for the core `interfaces/` folder —
 *   package-owned algorithm-internal shapes.
 *
 *   Cross-package contract types (`IZoneContribution`, `IZoneContext`,
 *   `IZoneRegistry`, `IFieldDescriptor`, `IColumnDescriptor`) live
 *   in `@stackra/contracts` and are imported from there per
 *   `.kiro/steering/contract-reexports.md`.
 */

export type { IntrinsicChild } from "./intrinsic-child.interface";
export type { OrderedItem } from "./ordered-item.interface";
export type { IZonesModuleOptions } from "./zones-module-options.interface";
