/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/zones
 * @description Public barrel for the zone/slot extensibility contract
 *   family.
 *
 *   Consumers import from `@stackra/contracts` directly — feature
 *   packages (`@stackra/zones`, `@stackra/sdui`) never re-export these
 *   symbols per `.kiro/steering/contract-reexports.md`.
 */

export type { ZonePosition } from "./zone-position.type";
export type { IZoneContext } from "./zone-context.interface";
export type {
  FieldKind,
  IFieldDescriptor,
  IFieldOption,
} from "./field-descriptor.interface";
export type { IColumnDescriptor } from "./column-descriptor.interface";
export type {
  IZoneContribution,
  IZoneContributionBase,
  IZoneReactContribution,
  IZoneSduiContribution,
  IZoneFieldContribution,
  IZoneColumnContribution,
} from "./zone-contribution.interface";
export type { IZoneRegistry } from "./zone-registry.interface";
